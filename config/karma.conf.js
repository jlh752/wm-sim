module.exports = function (config) {
  config.set({
    basePath: '../',

    files: [
      'app/gmsim.main.js',
	  'app/gmsim.player.js',
	  'app/gmsim.unit.js',
	  'app/gmsim.ability.js',
	  'app/data/simdata.js',
	  
	  'test/unit/extra.js',
	  'test/unit/main.js'
    ],

    frameworks: ['jasmine'],

    autoWatch: true,

    browsers: ['Chrome'],

    junitReporter: {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }
  });
};
