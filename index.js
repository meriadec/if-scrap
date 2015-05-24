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

  console.log(chalk.magenta('> ' + (IF_ids.indexOf(id) + 1) + '/' + IF_ids.length));

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
  fs.writeFile('out.csv', buildCSV(res))
});

// Scrap the page

function scrap () {

  var infos = {};

  // get name
  infos.name = $('.edit_lieu_titre').html() || '';

  // get country
  infos.country = $('.edit_selectm_59 .valeurs').html() || '';

  // get phone
  infos.phone = $('.edit_lieu_tel').html() || '';

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
    'blog': 'site',
    'page facebook': 'facebook',
    'compte twitter': 'twitter',
    'facebook if cracovie': 'facebook',
    'facebook if varsovie': 'facebook',
    'site internet de l\'ambassade': 'site',
    'site internet de l\'institut français à hanoï': 'site',
    'site internet du consulat général': 'site',
    'site internet en construction': 'site',
    'internet': 'site'
  };

  var labelFilter = ['site', 'facebook', 'twitter'];

  Array.prototype.forEach.call(links, function (link) {
    link = $(link);
    var label = link.html().toLowerCase().trim();
    if (labelMap[label]) { label = labelMap[label]; }
    if (labelFilter.indexOf(label) === -1) { return; }
    infos[label] = link.attr('href');
  });

  return infos;

}

// Generate csv from results

function buildCSV (res) {
  var out = [];
  out.push(['NAME', 'COUNTRY', 'PHONE', 'SITE', 'TWITTER', 'FACEBOOK', 'REF_URL']);
  res.forEach(e => {
    out.push([
      e.name || '',
      e.country || '',
      e.phone || '',
      e.site || '',
      e.twitter || '',
      e.facebook || '',
      e.url || ''
    ]);
  });
  return out.map(row => '"' + row.join('","') + '"').join('\n');
}
