import AbstractView from '../framework/view/abstract-view.js';
import {FilterType} from '../const.js';

const NoPointTextType = {
  [FilterType.EVERYTHING]: 'Click New Event to create your first point',
  [FilterType.FUTURE]: 'There are no future events now',
  [FilterType.PRESENT]: 'There are no present events now',
  [FilterType.PAST]: 'There are no past events now',
};

const LOADING_ERROR_TEXT = 'Failed to load latest route information';

function createNoPointTemplate({filterType, isLoadingError}) {
  const noPointText = isLoadingError ? LOADING_ERROR_TEXT : NoPointTextType[filterType];

  return `<p class="trip-events__msg">${noPointText}</p>`;
}

export default class NoPointView extends AbstractView {
  #filterType = null;
  #isLoadingError = false;

  constructor({filterType, isLoadingError = false}) {
    super();
    this.#filterType = filterType;
    this.#isLoadingError = isLoadingError;
  }

  get template() {
    return createNoPointTemplate({
      filterType: this.#filterType,
      isLoadingError: this.#isLoadingError,
    });
  }
}
