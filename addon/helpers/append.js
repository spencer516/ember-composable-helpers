import Ember from 'ember';
import { isEmberArray as isArray } from 'ember-array/utils';
import computed from 'ember-computed';
import Helper from 'ember-helper';
import get from 'ember-metal/get';
import observer from 'ember-metal/observer';
import set from 'ember-metal/set';
import { guidFor } from 'ember-metal/utils';
import { isEmpty } from 'ember-utils';

const { defineProperty } = Ember;

const idForArray = (array) => `__array-${guidFor(array)}`;

export function append(...dependentKeys) {
  dependentKeys = dependentKeys || [];
  let arrayKeys = dependentKeys.map((dependentKey) => {
    return `${dependentKey}.[]`;
  });
  return computed(...arrayKeys, function() {
    let array = dependentKeys.map((dependentKey) => {
      let value = get(this, dependentKey);
      return isArray(value) ? value.toArray() : [value];
    });

    return [].concat(...array);
  });
}

export default Helper.extend({
  compute([...arrays]) {
    set(this, 'arrays', arrays);

    return get(this, 'content');
  },

  valuesDidChange: observer('arrays.[]', function() {
    let arrays = get(this, 'arrays');

    let oldArrayKeys = get(this, 'arrayKeys') || [];
    let newArrayKeys = arrays.map(idForArray);

    let keysToRemove = oldArrayKeys.filter((key) => {
      return newArrayKeys.indexOf(key) === -1;
    });

    keysToRemove.forEach((key) => set(this, key, null));
    arrays.forEach((array) => set(this, idForArray(array), array));

    set(this, 'arrayKeys', newArrayKeys);

    if (isEmpty(arrays)) {
      defineProperty(this, 'content', []);
      return;
    }

    defineProperty(this, 'content', append(...newArrayKeys));
  }),

  contentDidChange: observer('content.[]', function() {
    this.recompute();
  })
});
