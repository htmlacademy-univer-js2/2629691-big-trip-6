import Observable from '../framework/observable.js';
import {EVENT_TYPES, UpdateType} from '../const.js';
import {filters} from '../mock/filter.js';
import {sorts} from '../mock/sort.js';

export default class PointsModel extends Observable {
  #points = [];
  #offers = [];
  #destinations = [];
  #eventTypes = EVENT_TYPES;
  #filters = filters;
  #sorts = sorts;
  #tripApiService = null;
  #isLoadingError = false;

  constructor({tripApiService}) {
    super();
    this.#tripApiService = tripApiService;
  }

  get points() {
    return this.#points;
  }

  get offers() {
    return this.#offers;
  }

  get destinations() {
    return this.#destinations;
  }

  get eventTypes() {
    return this.#eventTypes;
  }

  get filters() {
    return this.#filters;
  }

  get sorts() {
    return this.#sorts;
  }

  get isLoadingError() {
    return this.#isLoadingError;
  }

  async init() {
    const results = await Promise.allSettled([
      this.#tripApiService.points,
      this.#tripApiService.destinations,
      this.#tripApiService.offers,
    ]);

    const isRejected = results.some((result) => result.status === 'rejected');

    if (isRejected) {
      this.#points = [];
      this.#destinations = [];
      this.#offers = [];
      this.#isLoadingError = true;

      this._notify(UpdateType.INIT);
      return;
    }

    const [pointsResult, destinationsResult, offersResult] = results;

    this.#points = pointsResult.value;
    this.#destinations = destinationsResult.value;
    this.#offers = offersResult.value;
    this.#isLoadingError = false;

    this._notify(UpdateType.INIT);
  }

  async updatePoint(updateType, updatedPoint) {
    const index = this.#points.findIndex((point) => point.id === updatedPoint.id);

    if (index === -1) {
      throw new Error('Can\'t update unexisting point');
    }

    const response = await this.#tripApiService.updatePoint(updatedPoint);

    this.#points = [
      ...this.#points.slice(0, index),
      response,
      ...this.#points.slice(index + 1),
    ];

    this._notify(updateType, response);
  }

  async addPoint(updateType, newPointData) {
    const response = await this.#tripApiService.addPoint(newPointData);

    this.#points = [
      response,
      ...this.#points,
    ];

    this._notify(updateType, response);
  }

  async deletePoint(updateType, deletedPoint) {
    const index = this.#points.findIndex((point) => point.id === deletedPoint.id);

    if (index === -1) {
      throw new Error('Can\'t delete unexisting point');
    }

    await this.#tripApiService.deletePoint(deletedPoint);

    this.#points = [
      ...this.#points.slice(0, index),
      ...this.#points.slice(index + 1),
    ];

    this._notify(updateType, deletedPoint);
  }
}
