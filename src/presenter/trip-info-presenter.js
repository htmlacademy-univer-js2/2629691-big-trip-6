import {remove, render, replace, RenderPosition} from '../framework/render.js';
import {getEventDate} from '../utils/point.js';
import TripInfoView from '../view/trip-info-view.js';

const MAX_ROUTE_DESTINATIONS = 3;

function getDestinationById(destinations, destinationId) {
  return destinations.find((destination) => destination.id === destinationId);
}

function getSelectedOffers(offers, offerIds) {
  return offers.filter((offer) => offerIds.includes(offer.id));
}

function sortPointsByDay(firstPoint, secondPoint) {
  return new Date(firstPoint.startDateTime) - new Date(secondPoint.startDateTime);
}

function createTripTitle(points, destinations) {
  const destinationNames = points
    .map((point) => getDestinationById(destinations, point.destinationId))
    .filter((destination) => destination !== undefined)
    .map((destination) => destination.name);

  if (destinationNames.length === 0) {
    return '';
  }

  if (destinationNames.length > MAX_ROUTE_DESTINATIONS) {
    return `${destinationNames[0]} &mdash; ... &mdash; ${destinationNames[destinationNames.length - 1]}`;
  }

  return destinationNames.join(' &mdash; ');
}

function createTripDates(points) {
  if (points.length === 0) {
    return '';
  }

  const sortedPoints = [...points].sort(sortPointsByDay);
  const firstPoint = sortedPoints[0];
  const lastPoint = sortedPoints[sortedPoints.length - 1];

  return `${getEventDate(firstPoint.startDateTime)}&nbsp;&mdash;&nbsp;${getEventDate(lastPoint.endDateTime)}`;
}

function calculateTripCost(points, offers) {
  return points.reduce((totalCost, point) => {
    const selectedOffers = getSelectedOffers(offers, point.offerIds);
    const offersCost = selectedOffers.reduce((sum, offer) => sum + offer.price, 0);

    return totalCost + point.price + offersCost;
  }, 0);
}

function createTripInfo(points, destinations, offers) {
  const sortedPoints = [...points].sort(sortPointsByDay);

  return {
    title: createTripTitle(sortedPoints, destinations),
    dates: createTripDates(sortedPoints),
    cost: calculateTripCost(sortedPoints, offers),
  };
}

export default class TripInfoPresenter {
  #tripInfoContainer = null;
  #pointsModel = null;
  #tripInfoComponent = null;

  constructor({tripInfoContainer, pointsModel}) {
    this.#tripInfoContainer = tripInfoContainer;
    this.#pointsModel = pointsModel;

    this.#pointsModel.addObserver(this.#handleModelEvent);
  }

  init() {
    const points = this.#pointsModel.points;

    if (points.length === 0) {
      this.#clearTripInfo();
      return;
    }

    const previousTripInfoComponent = this.#tripInfoComponent;

    this.#tripInfoComponent = new TripInfoView({
      tripInfo: createTripInfo(
        points,
        this.#pointsModel.destinations,
        this.#pointsModel.offers,
      ),
    });

    if (previousTripInfoComponent === null) {
      render(this.#tripInfoComponent, this.#tripInfoContainer, RenderPosition.AFTERBEGIN);
      return;
    }

    replace(this.#tripInfoComponent, previousTripInfoComponent);
    remove(previousTripInfoComponent);
  }

  #clearTripInfo() {
    remove(this.#tripInfoComponent);
    this.#tripInfoComponent = null;
  }

  #handleModelEvent = () => {
    this.init();
  };
}
