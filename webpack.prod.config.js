'use strict';

const OfflinePlugin = require('offline-plugin');
const fetchSampleSpec = require('@generative-music/samples.generative.fm/node-client');
const {
  version,
} = require('@generative-music/samples.generative.fm/package.json');
const configPromise = require('./webpack.config');

const getConfig = configPromise.then(config => {
  config.mode = 'production';
  delete config.devtool;
  return fetchSampleSpec().then(spec => {
    const { samples } = spec;
    const sampleFilenames = Reflect.ownKeys(samples).reduce(
      (filenames, instrumentName) => {
        const instrumentSamplesByFormat = samples[instrumentName];
        return filenames.concat(
          Reflect.ownKeys(instrumentSamplesByFormat).reduce(
            (instrumentSampleFilenames, format) => {
              const formatSamples = instrumentSamplesByFormat[format];
              if (Array.isArray(formatSamples)) {
                return instrumentSampleFilenames.concat(formatSamples);
              }
              return instrumentSampleFilenames.concat(
                Object.values(formatSamples)
              );
            },
            []
          )
        );
      },
      [`https://samples.generative.fm/index.${version}.json`]
    );

    config.plugins.push(
      new OfflinePlugin({
        appShell: '/',
        externals: sampleFilenames.concat([
          'favicon.ico',
          'manifest.json',
          'https://platform.twitter.com/widgets.js',
        ]),
        autoUpdate: true,
        ServiceWorker: {
          events: true,
        },
        caches: {
          main: [':rest:'],
          optional: sampleFilenames,
        },
      })
    );

    return config;
  });
});

module.exports = getConfig;
