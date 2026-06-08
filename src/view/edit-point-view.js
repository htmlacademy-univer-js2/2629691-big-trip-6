import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import {getEditDate} from '../utils/point.js';

const FLATPICKR_DATE_FORMAT = 'd/m/y H:i';

function getDestinationByName(destinations, destinationName) {
  return destinations.find((destination) => destination.name === destinationName);
}

function createDisabledAttribute(isDisabled) {
  return isDisabled ? ' disabled' : '';
}

function createEventDateValue(date) {
  return date ? getEditDate(date) : '';
}

function createEventTypeTemplate(eventType, checkedType, pointId, isDisabled) {
  const isChecked = eventType === checkedType ? ' checked' : '';
  const disabledAttribute = createDisabledAttribute(isDisabled);

  return (
    `<div class="event__type-item">
      <input
        id="event-type-${eventType}-${pointId}"
        class="event__type-input  visually-hidden"
        type="radio"
        name="event-type"
        value="${eventType}"
        ${isChecked}
        ${disabledAttribute}
      >
      <label
        class="event__type-label  event__type-label--${eventType}"
        for="event-type-${eventType}-${pointId}"
      >
        ${eventType}
      </label>
    </div>`
  );
}

function createDestinationOptionTemplate(destination) {
  return `<option value="${destination.name}"></option>`;
}

function createOfferTemplate(offer, offerIds, pointId, isDisabled) {
  const isChecked = offerIds.includes(offer.id) ? ' checked' : '';
  const disabledAttribute = createDisabledAttribute(isDisabled);

  return (
    `<div class="event__offer-selector">
      <input
        class="event__offer-checkbox  visually-hidden"
        id="event-offer-${offer.id}-${pointId}"
        type="checkbox"
        name="event-offer-${offer.id}"
        value="${offer.id}"
        ${isChecked}
        ${disabledAttribute}
      >
      <label class="event__offer-label" for="event-offer-${offer.id}-${pointId}">
        <span class="event__offer-title">${offer.title}</span>
        &plus;&euro;&nbsp;
        <span class="event__offer-price">${offer.price}</span>
      </label>
    </div>`
  );
}

function createPhotoTemplate(photo) {
  return `<img class="event__photo" src="${photo.src}" alt="${photo.description}">`;
}

function createEventTypesTemplate(point) {
  return point.eventTypes
    .map((eventType) => createEventTypeTemplate(eventType, point.type, point.id, point.isDisabled))
    .join('');
}

function createDestinationsTemplate(destinations) {
  return destinations
    .map((destination) => createDestinationOptionTemplate(destination))
    .join('');
}

function createAvailableOffers(point) {
  return point.offers.filter((offer) => offer.type === point.type);
}

function createPhotosTemplate(photos) {
  return photos
    .map((photo) => createPhotoTemplate(photo))
    .join('');
}

function createOffersSectionTemplate(point) {
  const availableOffers = createAvailableOffers(point);

  if (availableOffers.length === 0) {
    return '';
  }

  return (
    `<section class="event__section  event__section--offers">
      <h3 class="event__section-title  event__section-title--offers">Offers</h3>

      <div class="event__available-offers">
        ${availableOffers
      .map((offer) => createOfferTemplate(offer, point.offerIds, point.id, point.isDisabled))
      .join('')}
      </div>
    </section>`
  );
}

function createDestinationPhotosTemplate(destination) {
  if (!destination.photos || destination.photos.length === 0) {
    return '';
  }

  return (
    `<div class="event__photos-container">
      <div class="event__photos-tape">
        ${createPhotosTemplate(destination.photos)}
      </div>
    </div>`
  );
}

function createDestinationSectionTemplate(point) {
  if (!point.destination) {
    return '';
  }

  const hasDescription = Boolean(point.destination.description);
  const hasPhotos = point.destination.photos && point.destination.photos.length > 0;

  if (!hasDescription && !hasPhotos) {
    return '';
  }

  return (
    `<section class="event__section  event__section--destination">
      <h3 class="event__section-title  event__section-title--destination">Destination</h3>
      <p class="event__destination-description">${point.destination.description}</p>

      ${createDestinationPhotosTemplate(point.destination)}
    </section>`
  );
}

function createEditPointTemplate(point) {
  const eventTypesTemplate = createEventTypesTemplate(point);
  const destinationsTemplate = createDestinationsTemplate(point.destinations);
  const offersSectionTemplate = createOffersSectionTemplate(point);
  const destinationSectionTemplate = createDestinationSectionTemplate(point);
  const disabledAttribute = createDisabledAttribute(point.isDisabled);
  const destinationName = point.destination ? point.destination.name : '';
  const saveButtonText = point.isSaving ? 'Saving...' : 'Save';
  const resetButtonText = point.isNewPoint ? 'Cancel' : 'Delete';
  const deleteButtonText = point.isDeleting ? 'Deleting...' : resetButtonText;

  return (
    `<li class="trip-events__item">
      <form class="event event--edit" action="#" method="post">
        <header class="event__header">
          <div class="event__type-wrapper">
            <label class="event__type  event__type-btn" for="event-type-toggle-${point.id}">
              <span class="visually-hidden">Choose event type</span>
              <img
                class="event__type-icon"
                width="17"
                height="17"
                src="img/icons/${point.type}.png"
                alt="Event type icon"
              >
            </label>
            <input
              class="event__type-toggle  visually-hidden"
              id="event-type-toggle-${point.id}"
              type="checkbox"
              ${disabledAttribute}
            >

            <div class="event__type-list">
              <fieldset class="event__type-group">
                <legend class="visually-hidden">Event type</legend>
                ${eventTypesTemplate}
              </fieldset>
            </div>
          </div>

          <div class="event__field-group  event__field-group--destination">
            <label class="event__label  event__type-output" for="event-destination-${point.id}">
              ${point.type}
            </label>
            <input
              class="event__input  event__input--destination"
              id="event-destination-${point.id}"
              type="text"
              name="event-destination"
              value="${destinationName}"
              list="destination-list-${point.id}"
              ${disabledAttribute}
            >
            <datalist id="destination-list-${point.id}">
              ${destinationsTemplate}
            </datalist>
          </div>

          <div class="event__field-group  event__field-group--time">
            <label class="visually-hidden" for="event-start-time-${point.id}">From</label>
            <input
              class="event__input  event__input--time"
              id="event-start-time-${point.id}"
              type="text"
              name="event-start-time"
              value="${createEventDateValue(point.startDateTime)}"
              ${disabledAttribute}
            >
            &mdash;
            <label class="visually-hidden" for="event-end-time-${point.id}">To</label>
            <input
              class="event__input  event__input--time"
              id="event-end-time-${point.id}"
              type="text"
              name="event-end-time"
              value="${createEventDateValue(point.endDateTime)}"
              ${disabledAttribute}
            >
          </div>

          <div class="event__field-group  event__field-group--price">
            <label class="event__label" for="event-price-${point.id}">
              <span class="visually-hidden">Price</span>
              &euro;
            </label>
            <input
              class="event__input  event__input--price"
              id="event-price-${point.id}"
              type="number"
              min="0"
              name="event-price"
              value="${point.price}"
              ${disabledAttribute}
            >
          </div>

          <button class="event__save-btn  btn  btn--blue" type="submit" ${disabledAttribute}>
            ${saveButtonText}
          </button>
          <button class="event__reset-btn" type="reset">
            ${deleteButtonText}
          </button>
          <button class="event__rollup-btn" type="button">
            <span class="visually-hidden">Open event</span>
          </button>
        </header>

        <section class="event__details">
          ${offersSectionTemplate}
          ${destinationSectionTemplate}
        </section>
      </form>
    </li>`
  );
}

export default class EditPointView extends AbstractStatefulView {
  #handleFormSubmit = null;
  #handleRollupClick = null;
  #handleDeleteClick = null;
  #startDatepicker = null;
  #endDatepicker = null;

  constructor({point, onFormSubmit, onRollupClick, onDeleteClick}) {
    super();
    this._setState(EditPointView.parsePointToState(point));
    this.#handleFormSubmit = onFormSubmit;
    this.#handleRollupClick = onRollupClick;
    this.#handleDeleteClick = onDeleteClick;

    this._restoreHandlers();
  }

  get template() {
    return createEditPointTemplate(this._state);
  }

  removeElement() {
    super.removeElement();

    this.#destroyDatepickers();
  }

  reset(point) {
    this.updateElement(EditPointView.parsePointToState(point));
  }

  setSaving() {
    this.updateElement({
      isDisabled: true,
      isSaving: true,
    });
  }

  setDeleting() {
    this.updateElement({
      isDisabled: true,
      isDeleting: true,
    });
  }

  shake() {
    this.element.animate(
      [
        {transform: 'translateX(0)'},
        {transform: 'translateX(-10px)'},
        {transform: 'translateX(10px)'},
        {transform: 'translateX(-10px)'},
        {transform: 'translateX(10px)'},
        {transform: 'translateX(0)'},
      ],
      {
        duration: 600,
      },
    );
  }

  _restoreHandlers() {
    this.#destroyDatepickers();

    this.element.querySelector('form').addEventListener('submit', this.#formSubmitHandler);
    this.element.querySelector('.event__rollup-btn').addEventListener('click', this.#rollupClickHandler);
    this.element.querySelector('.event__reset-btn').addEventListener('click', this.#deleteClickHandler);
    this.element.querySelector('.event__type-group').addEventListener('change', this.#eventTypeChangeHandler);
    this.element.querySelector('.event__input--destination').addEventListener('change', this.#destinationChangeHandler);
    this.element.querySelector('.event__input--price').addEventListener('input', this.#priceInputHandler);

    const offersContainer = this.element.querySelector('.event__available-offers');

    if (offersContainer) {
      offersContainer.addEventListener('change', this.#offerChangeHandler);
    }

    this.#setStartDatepicker();
    this.#setEndDatepicker();
  }

  #setStartDatepicker() {
    this.#startDatepicker = flatpickr(
      this.element.querySelector(`#event-start-time-${this._state.id}`),
      {
        dateFormat: FLATPICKR_DATE_FORMAT,
        defaultDate: this._state.startDateTime || null,
        enableTime: true,
        'time_24hr': true,
        onChange: this.#startDateChangeHandler,
      },
    );
  }

  #setEndDatepicker() {
    this.#endDatepicker = flatpickr(
      this.element.querySelector(`#event-end-time-${this._state.id}`),
      {
        dateFormat: FLATPICKR_DATE_FORMAT,
        defaultDate: this._state.endDateTime || null,
        enableTime: true,
        'time_24hr': true,
        onChange: this.#endDateChangeHandler,
      },
    );
  }

  #destroyDatepickers() {
    if (this.#startDatepicker) {
      this.#startDatepicker.destroy();
      this.#startDatepicker = null;
    }

    if (this.#endDatepicker) {
      this.#endDatepicker.destroy();
      this.#endDatepicker = null;
    }
  }

  #formSubmitHandler = (evt) => {
    evt.preventDefault();
    this.#handleFormSubmit(EditPointView.parseStateToPoint(this._state));
  };

  #rollupClickHandler = (evt) => {
    evt.preventDefault();

    if (this._state.isDisabled) {
      return;
    }

    this.#handleRollupClick();
  };

  #deleteClickHandler = (evt) => {
    evt.preventDefault();

    if (this._state.isDisabled) {
      return;
    }

    this.#handleDeleteClick(EditPointView.parseStateToPoint(this._state));
  };

  #eventTypeChangeHandler = (evt) => {
    if (!evt.target.classList.contains('event__type-input')) {
      return;
    }

    evt.preventDefault();

    this.updateElement({
      type: evt.target.value,
      offerIds: [],
    });
  };

  #destinationChangeHandler = (evt) => {
    evt.preventDefault();

    const destination = getDestinationByName(this._state.destinations, evt.target.value);

    if (!destination) {
      this.updateElement({
        destinationId: null,
        destination: undefined,
      });

      return;
    }

    this.updateElement({
      destinationId: destination.id,
      destination,
    });
  };

  #offerChangeHandler = (evt) => {
    if (!evt.target.classList.contains('event__offer-checkbox')) {
      return;
    }

    const offerId = evt.target.value;
    const offerIds = new Set(this._state.offerIds);

    if (evt.target.checked) {
      offerIds.add(offerId);
    } else {
      offerIds.delete(offerId);
    }

    this._setState({
      offerIds: Array.from(offerIds),
    });
  };

  #priceInputHandler = (evt) => {
    this._setState({
      price: Number(evt.target.value),
    });
  };

  #startDateChangeHandler = ([userDate]) => {
    this._setState({
      startDateTime: userDate ? userDate.toISOString() : null,
    });
  };

  #endDateChangeHandler = ([userDate]) => {
    this._setState({
      endDateTime: userDate ? userDate.toISOString() : null,
    });
  };

  static parsePointToState(point) {
    return {
      ...point,
      isDisabled: false,
      isSaving: false,
      isDeleting: false,
      isNewPoint: point.isNewPoint ?? false,
    };
  }

  static parseStateToPoint(state) {
    const point = {...state};

    delete point.offers;
    delete point.destinations;
    delete point.eventTypes;
    delete point.destination;
    delete point.selectedOffers;
    delete point.isDisabled;
    delete point.isSaving;
    delete point.isDeleting;
    delete point.isNewPoint;

    return point;
  }
}
