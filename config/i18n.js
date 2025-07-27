const i18n = require('i18n');
const path = require('path');

i18n.configure({
  locales: ['en', 'hi', 'es'],
  directory: path.join(__dirname, '..', 'locales'),
  defaultLocale: 'en',
  cookie: 'locale',
  queryParameter: 'lang',
  autoReload: true,
  updateFiles: false,
  api: {
    '__': '__',
    '__n': '__n'
  }
});

module.exports = i18n;
