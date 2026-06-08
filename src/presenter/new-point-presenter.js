import {remove, render, RenderPosition} from '../framework/render.js';
import {UpdateType, UserAction} from '../const.js';
import EditPointView from '../view/edit-point-view.js';

const ESCAPE_KEY = 'Escape';
const DEFAULT_TYPE = 'flight';
const DEFAULT_PRICE = 0;

function getDestinationById(destinations, destinationId) {
  return destinations.find((destination) => destination.id === destinationId);
}

function getSelectedOffers(offers, offerIds) {
  return offers.filter((offer) => offerIds.includes(offer.id));
}

function createNewPoint() {
  return {
    id: crypto.randomUUID(),
    type: DEFAULT_TYPE,
    price: DEFAULT_PRICE,
    startDateTime: null,
    endDateTime: null,
    destinationId: null,
    isFavorite: false,
    offerIds: [],
    isNewPoint: true,
  };
}

function createFormData(point, destinations, offers, eventTypes) {
  const destination = getDestinationById(destinations, point.destinationId);

  return {
    ...point,
    destination,
    offers,
    selectedOffers: getSelectedOffers(offers, point.offerIds),
    destinations,
    eventTypes,
  };
}

export default class NewPointPresenter {
  #pointContainer = null;
  #destinations = null;
  #offers = null;
  #eventTypes = null;

  #newPointComponent = null;
  #handleDataChange = null;
  #handleDestroy = null;

  constructor({pointContainer, destinations, offers, eventTypes, onDataChange, onDestroy}) {
    this.#pointContainer = pointContainer;
    this.#destinations = destinations;
    this.#offers = offers;
    this.#eventTypes = eventTypes;
    this.#handleDataChange = onDataChange;
    this.#handleDestroy = onDestroy;
  }

  init() {
    if (this.#newPointComponent !== null) {
      return;
    }

    const newPoint = createNewPoint();
    const formData = createFormData(
      newPoint,
      this.#destinations,
      this.#offers,
      this.#eventTypes,
    );

    this.#newPointComponent = new EditPointView({
      point: formData,
      onFormSubmit: this.#handleFormSubmit,
      onRollupClick: this.#handleCancelClick,
      onDeleteClick: this.#handleCancelClick,
    });

    render(this.#newPointComponent, this.#pointContainer, RenderPosition.AFTERBEGIN);
    document.addEventListener('keydown', this.#escKeydownHandler);
  }

  destroy() {
    if (this.#newPointComponent === null) {
      return;
    }

    remove(this.#newPointComponent);
    this.#newPointComponent = null;
    document.removeEventListener('keydown', this.#escKeydownHandler);
  }

  #handleFormSubmit = async (newPoint) => {
    this.#newPointComponent.setSaving();

    try {
      await this.#handleDataChange(
        UserAction.ADD_POINT,
        UpdateType.MINOR,
        newPoint,
      );
    } catch (err) {
      const formData = createFormData(
        {
          ...newPoint,
          isNewPoint: true,
        },
        this.#destinations,
        this.#offers,
        this.#eventTypes,
      );

      this.#newPointComponent.reset(formData);
      this.#newPointComponent.shake();
    }
  };

  #handleCancelClick = () => {
    this.#handleDestroy();
  };

  #escKeydownHandler = (evt) => {
    if (evt.key === ESCAPE_KEY) {
      evt.preventDefault();
      this.#handleDestroy();
    }
  };
}
