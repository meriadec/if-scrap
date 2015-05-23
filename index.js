'use strict';

// Dependencies
// ============

const Nightmare = require('nightmare');
const async     = require('async');
const chalk     = require('chalk');
const _         = require('lodash');
const fs        = require('fs');

// List of all IF ids
// ==================

var IF_ids = require('./IF_ids.json');

// Config
// ======

const URL = 'http://www.ifmapp.institutfrancais.com/les-if-dans-le-monde';

// Core
// ====

async.mapSeries(IF_ids, function (id, done) {

  console.log(chalk.magenta('> ' + (IF_ids.indexOf(id)) + '/' + IF_ids.length));

  var infos = { url: URL + '#f2_' + id };

  new Nightmare()
    .goto(infos.url)
    .evaluate(scrap, function (scraped) { _.extend(infos, scraped); })
    .run(function (err) {
      if (err) { return done(err); }
      return done(null, infos);
    });

}, function (err, res) {
  if (err) { return console.log(err); }
  fs.writeFile('out.json', JSON.stringify(res, null, 2));
});

// Scrap the page

function scrap () {

  var infos = {};

  // get title
  infos.title = $('.edit_lieu_titre').html();
  if (!infos.title) { infos.title = '[?]'; }

  // get country
  infos.country = $('.edit_selectm_59 .valeurs').html();
  if (!infos.country) { infos.country = '[?]'; }

  // get phone
  infos.phone = $('.edit_lieu_tel').html();
  if (!infos.phone) { infos.phone = '[?]'; }

  // get email if exists
  var infolines = $('#onglet_1 .infoline');
  Array.prototype.forEach.call(infolines, function (infoline) {
    infoline = $(infoline);
    var label = infoline.find('h3').first().html();
    if (label === 'Contact : ') {
      infos.email = infoline.find('a').first().html();
    }
  });

  // get facebook, twitter, etc.
  var links = $('#onglet_2 a');

  var labelMap = {
    'site internet': 'site',
    'daily motion': 'dailymotion',
    'you tube': 'youtube'
  };

  Array.prototype.forEach.call(links, function (link) {
    link = $(link);
    var label = link.html().toLowerCase().trim();
    if (labelMap[label]) { label = labelMap[label]; }
    infos[label] = link.attr('href');
  });
  return infos;
}
