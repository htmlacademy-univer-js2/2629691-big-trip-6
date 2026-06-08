import UiBlocker from '../framework/ui-blocker/ui-blocker.js';
import {remove, render} from '../framework/render.js';
import {FilterType, UpdateType, UserAction} from '../const.js';
import {filter} from '../utils/filter.js';
import SortView from '../view/sort-view.js';
import TripEventsView from '../view/trip-events-view.js';
import TripEventsListView from '../view/trip-events-list-view.js';
import NoPointView from '../view/no-point-view.js';
import LoadingView from '../view/loading-view.js';
import PointPresenter from './point-presenter.js';
import NewPointPresenter from './new-point-presenter.js';

const TimeLimit = {
  LOWER_LIMIT: 350,
  UPPER_LIMIT: 1000,
};

const SortType = {
  DAY: 'day',
  TIME: 'time',
  PRICE: 'price',
};

function getPointDuration(point) {
  return new Date(point.endDateTime) - new Date(point.startDateTime);
}

function sortPointsByDay(firstPoint, secondPoint) {
  return new Date(firstPoint.startDateTime) - new Date(secondPoint.startDateTime);
}

function sortPointsByTime(firstPoint, secondPoint) {
  return getPointDuration(secondPoint) - getPointDuration(firstPoint);
}

function sortPointsByPrice(firstPoint, secondPoint) {
  return secondPoint.price - firstPoint.price;
}

export default class BoardPresenter {
  #boardContainer = null;
  #newPointButtonElement = null;
  #pointsModel = null;
  #filterModel = null;

  #tripEventsComponent = new TripEventsView();
  #tripEventsListComponent = new TripEventsListView();
  #sortComponent = null;
  #noPointComponent = null;
  #loadingComponent = new LoadingView();
  #newPointPresenter = null;

  #pointPresenters = new Map();
  #points = [];
  #currentSortType = SortType.DAY;
  #isLoading = true;

  #uiBlocker = new UiBlocker({
    lowerLimit: TimeLimit.LOWER_LIMIT,
    upperLimit: TimeLimit.UPPER_LIMIT,
  });

  constructor({boardContainer, newPointButtonElement, pointsModel, filterModel}) {
    this.#boardContainer = boardContainer;
    this.#newPointButtonElement = newPointButtonElement;
    this.#pointsModel = pointsModel;
    this.#filterModel = filterModel;

    this.#pointsModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);

    this.#newPointButtonElement.disabled = true;
    this.#newPointButtonElement.addEventListener('click', this.#handleNewPointButtonClick);
  }

  init() {
    this.#points = this.#getFilteredPoints();

    render(this.#tripEventsComponent, this.#boardContainer);

    this.#renderBoard();
  }

  #getFilteredPoints() {
    const filterType = this.#filterModel.filter;

    return filter[filterType](this.#pointsModel.points);
  }

  #getSortedPoints() {
    switch (this.#currentSortType) {
      case SortType.TIME:
        return [...this.#points].sort(sortPointsByTime);
      case SortType.PRICE:
        return [...this.#points].sort(sortPointsByPrice);
      case SortType.DAY:
      default:
        return [...this.#points].sort(sortPointsByDay);
    }
  }

  #getSorts() {
    return this.#pointsModel.sorts.map((sort) => ({
      ...sort,
      isChecked: sort.type === this.#currentSortType,
    }));
  }

  #renderBoard() {
    if (this.#isLoading) {
      this.#renderLoading();
      return;
    }

    if (this.#points.length === 0) {
      this.#renderNoPoints();
      return;
    }

    this.#renderSort();
    this.#renderPointsList();
  }

  #renderLoading() {
    render(this.#loadingComponent, this.#tripEventsComponent.element);
  }

  #renderSort() {
    this.#sortComponent = new SortView({
      sorts: this.#getSorts(),
      onSortTypeChange: this.#handleSortTypeChange,
    });

    render(this.#sortComponent, this.#tripEventsComponent.element);
  }

  #renderNoPoints() {
    this.#noPointComponent = new NoPointView({
      filterType: this.#filterModel.filter,
      isLoadingError: this.#pointsModel.isLoadingError,
    });

    render(this.#noPointComponent, this.#tripEventsComponent.element);
  }

  #renderPointsList() {
    render(this.#tripEventsListComponent, this.#tripEventsComponent.element);
    this.#renderPoints();
  }

  #renderPoint(point) {
    const pointPresenter = new PointPresenter({
      pointContainer: this.#tripEventsListComponent.element,
      destinations: this.#pointsModel.destinations,
      offers: this.#pointsModel.offers,
      eventTypes: this.#pointsModel.eventTypes,
      onDataChange: this.#handleViewAction,
      onModeChange: this.#handleModeChange,
    });

    pointPresenter.init(point);
    this.#pointPresenters.set(point.id, pointPresenter);
  }

  #renderPoints() {
    this.#getSortedPoints().forEach((point) => {
      this.#renderPoint(point);
    });
  }

  #renderNewPoint() {
    this.#newPointPresenter = new NewPointPresenter({
      pointContainer: this.#tripEventsListComponent.element,
      destinations: this.#pointsModel.destinations,
      offers: this.#pointsModel.offers,
      eventTypes: this.#pointsModel.eventTypes,
      onDataChange: this.#handleViewAction,
      onDestroy: this.#handleNewPointDestroy,
    });

    this.#newPointPresenter.init();
  }

  #clearPoints() {
    this.#pointPresenters.forEach((presenter) => {
      presenter.destroy();
    });

    this.#pointPresenters.clear();
  }

  #clearNewPoint() {
    if (this.#newPointPresenter === null) {
      return;
    }

    this.#newPointPresenter.destroy();
    this.#newPointPresenter = null;
  }

  #clearBoard() {
    this.#clearNewPoint();
    this.#clearPoints();

    remove(this.#sortComponent);
    remove(this.#noPointComponent);
    remove(this.#loadingComponent);
    remove(this.#tripEventsListComponent);

    this.#tripEventsListComponent = new TripEventsListView();
  }

  #handleViewAction = async (actionType, updateType, updatedPoint) => {
    this.#uiBlocker.block();

    try {
      switch (actionType) {
        case UserAction.UPDATE_POINT:
          await this.#pointsModel.updatePoint(updateType, updatedPoint);
          break;
        case UserAction.ADD_POINT:
          await this.#pointsModel.addPoint(updateType, updatedPoint);
          break;
        case UserAction.DELETE_POINT:
          await this.#pointsModel.deletePoint(updateType, updatedPoint);
          break;
      }
    } finally {
      this.#uiBlocker.unblock();
    }
  };

  #handleModelEvent = (updateType) => {
    switch (updateType) {
      case UpdateType.PATCH:
        this.#clearBoard();
        this.#points = this.#getFilteredPoints();
        this.#renderBoard();
        break;
      case UpdateType.MINOR:
        this.#newPointButtonElement.disabled = false;
        this.#clearBoard();
        this.#points = this.#getFilteredPoints();
        this.#renderBoard();
        break;
      case UpdateType.MAJOR:
        this.#clearBoard();
        this.#currentSortType = SortType.DAY;
        this.#points = this.#getFilteredPoints();
        this.#renderBoard();
        break;
      case UpdateType.INIT:
        this.#isLoading = false;
        this.#newPointButtonElement.disabled = false;
        this.#clearBoard();
        this.#points = this.#getFilteredPoints();
        this.#renderBoard();
        break;
    }
  };

  #handleModeChange = () => {
    this.#clearNewPoint();
    this.#newPointButtonElement.disabled = false;

    this.#pointPresenters.forEach((presenter) => {
      presenter.resetView();
    });
  };

  #handleNewPointButtonClick = (evt) => {
    evt.preventDefault();

    this.#currentSortType = SortType.DAY;
    this.#filterModel.setFilter(UpdateType.MAJOR, FilterType.EVERYTHING);
    this.#handleModeChange();

    if (this.#points.length === 0) {
      remove(this.#noPointComponent);
      render(this.#tripEventsListComponent, this.#tripEventsComponent.element);
    }

    this.#newPointButtonElement.disabled = true;
    this.#renderNewPoint();
  };

  #handleNewPointDestroy = () => {
    this.#clearNewPoint();
    this.#newPointButtonElement.disabled = false;

    if (this.#points.length === 0) {
      remove(this.#tripEventsListComponent);
      this.#tripEventsListComponent = new TripEventsListView();
      this.#renderNoPoints();
    }
  };

  #handleSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return;
    }

    this.#currentSortType = sortType;
    this.#clearBoard();
    this.#renderBoard();
  };
}
