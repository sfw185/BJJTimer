const loadFromLocalStorage = (key, defaultValue) => {
  try {
      const serializedValue = localStorage.getItem(key);
      if (serializedValue === null) {
          return defaultValue;
      }
      return JSON.parse(serializedValue);
  } catch (e) {
      console.error(`Error loading ${key} from localStorage`, e);
      return defaultValue;
  }
};

const saveToLocalStorage = (key, value) => {
  try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
  } catch (e) {
      console.error(`Error saving ${key} to localStorage`, e);
  }
};

export { loadFromLocalStorage, saveToLocalStorage };