import BoardPresenter from './presenter/board-presenter.js';
import FilterPresenter from './presenter/filter-presenter.js';
import TripInfoPresenter from './presenter/trip-info-presenter.js';
import FilterModel from './model/filter-model.js';
import PointsModel from './model/points-model.js';
import TripApiService from './trip-api-service.js';

const END_POINT = 'https://21.objects.htmlacademy.pro/big-trip';
const AUTHORIZATION = 'Basic minikustik2006-big-trip-2629691';

const tripMainElement = document.querySelector('.trip-main');
const tripControlsFiltersElement = document.querySelector('.trip-controls__filters');
const siteMainElement = document.querySelector('.page-main .page-body__container');
const tripEventsElement = siteMainElement.querySelector('.trip-events');

const tripApiService = new TripApiService(END_POINT, AUTHORIZATION);
const pointsModel = new PointsModel({tripApiService});
const filterModel = new FilterModel();

tripEventsElement.remove();

const tripInfoPresenter = new TripInfoPresenter({
  tripInfoContainer: tripMainElement,
  pointsModel,
});

tripInfoPresenter.init();

const filterPresenter = new FilterPresenter({
  filterContainer: tripControlsFiltersElement,
  filterModel,
  pointsModel,
});

filterPresenter.init();

const boardPresenter = new BoardPresenter({
  boardContainer: siteMainElement,
  pointsModel,
  filterModel,
});

boardPresenter.init();
pointsModel.init();
