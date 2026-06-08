import {remove, render, replace} from '../framework/render.js';
import {UpdateType} from '../const.js';
import {filter} from '../utils/filter.js';
import FilterView from '../view/filter-view.js';

export default class FilterPresenter {
  #filterContainer = null;
  #filterModel = null;
  #pointsModel = null;

  #filterComponent = null;

  constructor({filterContainer, filterModel, pointsModel}) {
    this.#filterContainer = filterContainer;
    this.#filterModel = filterModel;
    this.#pointsModel = pointsModel;

    this.#filterModel.addObserver(this.#handleModelEvent);
    this.#pointsModel.addObserver(this.#handleModelEvent);
  }

  init() {
    const previousFilterComponent = this.#filterComponent;

    this.#filterComponent = new FilterView({
      filters: this.#getFilters(),
      onFilterTypeChange: this.#handleFilterTypeChange,
    });

    if (previousFilterComponent === null) {
      render(this.#filterComponent, this.#filterContainer);
      return;
    }

    replace(this.#filterComponent, previousFilterComponent);
    remove(previousFilterComponent);
  }

  #getFilters() {
    const currentFilterType = this.#filterModel.filter;
    const points = this.#pointsModel.points;

    return this.#pointsModel.filters.map((filterItem) => ({
      ...filterItem,
      isChecked: filterItem.type === currentFilterType,
      isDisabled: filter[filterItem.type](points).length === 0,
    }));
  }

  #handleFilterTypeChange = (filterType) => {
    if (this.#filterModel.filter === filterType) {
      return;
    }

    this.#filterModel.setFilter(UpdateType.MAJOR, filterType);
  };

  #handleModelEvent = () => {
    this.init();
  };
}
