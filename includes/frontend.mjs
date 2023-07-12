import Screenshot from './screenshot.mjs'
import { copyDefs } from './dk.mjs'

let res = {};
let ICON_MODEL_URL = "";
let QUANTITY_MODEL_URL = "";

let stockpiles = [];
let imagesProcessed = 0;
let imagesTotal = 0;

export async function init(resources, icon_model_url, quantity_model_url) {
  res = resources;
  ICON_MODEL_URL = icon_model_url;
  QUANTITY_MODEL_URL = quantity_model_url;

  const ready = new Promise(function(resolve) {
    if (document.readyState != 'loading') {
      resolve();
    } else {
      window.addEventListener('DOMContentLoaded', () => resolve());
    }
  });

  await Promise.all([...Object.values(res), ready]).then(function (results) {
    let index = 0;
    for (const key of Object.keys(res)) {
      res[key] = results[index++];
    }
  });
  outputTotals();
  document.querySelector('.reset-pyramid').addEventListener('click', () => {
    stockpiles = [];
    imagesProcessed = 0;
    imagesTotal = 0;
    document.querySelector('.render').innerHTML = '';
    outputTotals();
  });
  // 82DK Stockpile tracking
  document.querySelector('.copy-stockpile').addEventListener('click', () => {
    const stockpile = stockpiles[0];
    let text = '';
    console.log('stockpile', stockpile)
    copyDefs.forEach(function([SheetName, CodeName]) {
      const details = res.CATALOG.find(e => e.CodeName == CodeName);
      if(!details){
        text += "x\n";
        console.warn('No details found for', SheetName, CodeName);
        return;
      }
      const inventory = stockpile.contents.find(e => e.CodeName == CodeName && e.isCrated === true);
      //console.log(CodeName, inventory);
      const amountStored = inventory ? inventory.quantity : 0;
      text += amountStored + "\n";
    });
    copyTextToClipboard(text.trim());
  })

  document.querySelector('select[name=format]').addEventListener('change', () => {
    outputTotals();
  });
  document.querySelector('select[name=definition]').addEventListener('change', () => {
    outputTotals();
  });
  document.querySelector('input[name=filter-full]').addEventListener('change', (e) => {
    if(e.target.checked) {
      document.querySelector('#pyramid').classList.add('filter-full');
    } else {
      document.querySelector('#pyramid').classList.remove('filter-full');
    }
  });
  document.querySelector('a[href="#help"]').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('#help').classList.toggle('hidden');
  });
  document.querySelector('#help').addEventListener('click', (e) => {
    e.preventDefault();
    if(e.target.id == 'help') {
      document.querySelector('#help').classList.toggle('hidden');
    }
  });

}

function fallbackCopyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}
function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(function() {
    console.log('Async: Copying to clipboard was successful!');
  }, function(err) {
    console.error('Async: Could not copy text: ', err);
  });
}

export function registerDefaultListeners() {
  document.querySelector('form').addEventListener('submit', function(e) {
    // Prevent a submit that would lose our work
    e.preventDefault();
  });

  window.addEventListener('paste', function(event) {
    const files = event.clipboardData.files || [];
    const images = Array.prototype.filter.call(files, f => f.type.startsWith('image/'));
    if(images.length === 0) {
      return;
    }
    stockpiles = [];
    imagesProcessed = 0;
    imagesTotal = 0;

    addImages(images);
  });
}

export function addInputListener(input) {
  input.addEventListener('change', function() {
    if (!this.files.length) {
      return;
    }
    stockpiles = [];
    imagesProcessed = 0;
    imagesTotal = 0;

    const files = Array.from(this.files).sort(function(a, b) {
      // Consistent ordering based on when each screenshot was captured
      return a.lastModified - b.lastModified;
    });

    addImages(files);
  });
}

export function addDownloadTotalsListener(downloadTotals) {
  downloadTotals.addEventListener('click', function() {
    const totals = document.querySelector('div.report');
    html2canvas(totals, {
      width: totals.scrollWidth,
      height: totals.scrollHeight,
      windowWidth: totals.scrollWidth + 16,
      windowHeight: totals.scrollHeight + 16,
    }).then(function(canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL();

      const time = new Date();
      link.download = time.toISOString() + "_" + 'foxhole-inventory-totals.png';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  });
}

export function addDownloadTSVListener(downloadTSV) {
  downloadTSV.addEventListener('click', function() {
    const items = [[
      'Stockpile Title',
      'Stockpile Name',
      'Structure Type',
      'Quantity',
      'Name',
      'Crated?',
      'Per Crate',
      'Total',
      'Description',
      'CodeName',
    ].join('\t')];
    for (const stockpile of stockpiles) {
      for (const element of stockpile.contents) {
        if (element.quantity == 0) {
          continue;
        }

        const details = res.CATALOG.find(e => e.CodeName == element.CodeName);
        if (typeof details == 'undefined') {
          continue;
        }
        const perCrate = ((details.ItemDynamicData || {}).QuantityPerCrate || 3)
            + (details.VehiclesPerCrateBonusQuantity || 0);
        const perUnit = element.isCrated ? perCrate : 1;

        items.push([
          stockpile.label.textContent.trim(),
          stockpile.header.name || '',
          stockpile.header.type || '',
          element.quantity,
          details.DisplayName,
          element.isCrated,
          element.isCrated ? perUnit : '',
          element.quantity * perUnit,
          details.Description,
          element.CodeName,
        ].join('\t'));
      }
    }

    const encoder = new TextEncoder();
    function toBinary(string) {
      // Expand UTF-8 characters to equivalent bytes
      let byteString = '';
      for (const byte of encoder.encode(string)) {
        byteString += String.fromCharCode(byte);
      }
      return byteString;
    }
    const base64TSV = window.btoa(toBinary(items.join('\n')));

    const link = document.createElement('a');
    link.href = `data:text/tab-separated-values;base64,${base64TSV}`;

    const time = new Date();
    link.download = time.toISOString() + "_" + 'foxhole-inventory.tsv';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

function stringValue(value, other) {
  return { userEnteredValue: { stringValue: value }, ...other };
}

function dateValue(date) {
  // Courtesy of https://stackoverflow.com/a/64814390
  const SheetDate = {
    origin: Date.UTC(1899, 11, 30, 0, 0, 0, 0),
    dayToMs: 24 * 60 * 60 * 1000,
  };
  const serial = (date.getTime() - SheetDate.origin) / SheetDate.dayToMs;
  return numberValue(serial, { userEnteredFormat: { numberFormat: { type: 'DATE_TIME' } } });
}

function numberValue(value, other) {
  return { userEnteredValue: { numberValue: value }, ...other };
}

export function getAppendGoogleRows(format="gapi") {
  const exportTime = new Date();
  const rows = [];
  stockpiles.sort( (a, b) => a.lastModified - b.lastModified );
  for (const stockpile of stockpiles) {
    const stockpileTime = new Date(stockpile.lastModified);
    const stockpileID = Math.floor(Math.random() * 1000000000000000);
    let isEmpty = true;
    for (const element of stockpile.contents) {
      if (element.quantity == 0) {
        continue;
      }
      isEmpty = false;

      const details = res.CATALOG.find(e => e.CodeName == element.CodeName);
      if (typeof details == 'undefined') {
        continue;
      }

      if (format == "gapi") {
        rows.push({
          values: [
            dateValue(exportTime),
            dateValue(stockpileTime),
            stringValue(stockpile.header.type || ''),
            stringValue(stockpile.header.name || ''),
            stringValue(stockpile.label.textContent.trim()),
            stringValue(element.CodeName),
            stringValue(details.DisplayName),
            numberValue(element.quantity),
            { userEnteredValue: { boolValue: element.isCrated } },
            numberValue(stockpileID),
          ],
        });
      } else if (format == "google-script") {
        rows.push([
          exportTime.toString(),
          stockpileTime.toString(),
          stockpile.header.type || '',
          stockpile.header.name || '',
          stockpile.label.textContent.trim(),
          element.CodeName,
          details.DisplayName,
          element.quantity,
          element.isCrated,
          stockpileID,
        ]);
      } else {
        console.error("Unexpected format");
      }
    }
    if (format == "google-script" && isEmpty) {
      rows.push([
        exportTime.toString(),
        stockpileTime.toString(),
        stockpile.header.type || '',
        stockpile.header.name || '',
        stockpile.label.textContent.trim(),
        "Update as empty stockpile",
        "nulling this stockpile",
        0,
        true,
        stockpileID,
      ]);
    }
  }
  return rows;
}

function addImages(files) {
  imagesTotal += files.length;

  const collage = document.querySelector('div.render');
  document.querySelector('.processing-status span').textContent = imagesProcessed + " of " + imagesTotal;

  files.forEach(function(file) {
    const container = document.createElement('div');

    const image = document.createElement('img');
    image.style.display = 'none';
    image.addEventListener('load', getProcessImage('@@UNUSED', file.lastModified), { once: true });
    image.src = URL.createObjectURL(file);
    container.appendChild(image);
    collage.innerHTML = '<span>Processing Screenshot...</span>';
    collage.appendChild(container);
  });
}

function gIds() {
  if (location.host == 'fir.gicode.net') {
    return {
      clientId: '432701922574-m5mkt6dp2bp8hbt27fuoo4s7bfhpq3jr.apps.googleusercontent.com',
      apiKey: 'AIzaSyB1FQ72hY28Ovc1mPbrBBVspj68-BvICOo',
      appId: '432701922574',
    };
  }

  return {
    clientId: '977197840282-f5c1jf3f4rumgnbv4rdm61l85gs0ue7m.apps.googleusercontent.com',
    apiKey: 'AIzaSyB0oavB9RY-kegde_YDLTM6H2PHhu5z7t4',
    appId: '977197840282',
  };
}

function getProcessImage(label, lastModified) {
  return function() {
    return processImage.call(this, label, lastModified);
  };

  async function processImage(_label, lastModified) {
    URL.revokeObjectURL(this.src);

    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;

    const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    context.drawImage(this, 0, 0);

    const stockpile = await Screenshot.process(canvas, ICON_MODEL_URL, res.ICON_CLASS_NAMES, QUANTITY_MODEL_URL, res.QUANTITY_CLASS_NAMES);
    if (stockpile) {
      document.querySelector('div.render span').remove();
      this.src = stockpile.box.canvas.toDataURL();
      stockpile.lastModified = lastModified;
      stockpiles.push(stockpile);
    }

    this.style.display = '';
    ++imagesProcessed;
    document.querySelector('.processing-status span').textContent = imagesProcessed + " of " + imagesTotal;

    if (imagesProcessed == imagesTotal) {
      window.stockpiles = stockpiles;
      window.stockpilesJSON = JSON.stringify(stockpiles.map(function(s) {
        return {
          file: 'base',
          box: {
            x: s.box.x,
            y: s.box.y,
            width: s.box.width,
            height: s.box.height,
          },
          header: {
            type: s.header.type || null,
            name: s.header.name || null,
          },
          contents: s.contents.map(function(e) {
            return {
              CodeName: e.CodeName,
              quantity: e.quantity,
              isCrated: e.isCrated,
            };
          }),
        };
      }), undefined, 2);

      outputTotals();

      // Timeout gives the UI a chance to reflow
      setTimeout(function() {
        const maxHeight = Array.from(document.querySelectorAll('div.render > div'))
            .map(e => e.getBoundingClientRect().height)
            .reduce((a, b) => Math.max(a, b), 0);

        const render = document.querySelector('div.render');
        if (maxHeight > render.clientHeight) {
          const margins = render.getBoundingClientRect().height - render.clientHeight;
          render.style.height = `${maxHeight + margins}px`;
        }
      }, 1);
    }
  }
}

function outputTotals() {
  const totals = {};
  const categories = {};

  for (const stockpile of stockpiles) {
    for (const element of stockpile.contents) {
      let key = element.CodeName;
      if (element.isCrated) {
        key += '-crated';
      }

      if (!totals[key]) {
        const catalogItem = res.CATALOG.find(e=>e.CodeName == element.CodeName);
        if (!catalogItem) {
          console.log(`${element.CodeName} missing from catalog`);
          continue;
        }

        const itemCategory = (catalogItem.ItemCategory || '').replace(/^EItemCategory::/, '');
        const vehicleCategory = catalogItem.VehicleProfileType ? 'Vehicles' : undefined;
        const structureCategory = catalogItem.BuildLocationType ? 'Structures' : undefined;

        const category = itemCategory || vehicleCategory || structureCategory;
        categories[category] ||= [];
        categories[category].push(key);

        totals[key] = {
          CodeName: element.CodeName,
          isCrated: element.isCrated,
          name: catalogItem.DisplayName,
          category: category,
          total: 0,
          collection: [],
        };
      }
      totals[key].total += element.quantity;
      totals[key].collection.push(element);
    }
  }

  const categoryOrder = {
    SmallArms: 1,
    HeavyArms: 2,
    HeavyAmmo: 3,
    Utility: 4,
    Medical: 5,
    Supplies: 6,
    Uniforms: 7,
    Vehicles: 8,
    Structures: 9,
  };
  const sortedCategories = Object.keys(categories).sort(function(a, b) {
    return (categoryOrder[a] || Infinity) - (categoryOrder[b] || Infinity);
  });

  // Pyramid  start
  const format = document.querySelector('select[name=format]').value;
  const definition = document.querySelector('select[name=definition]').value;
  const pyramid = document.querySelector('div#pyramid');
  pyramid.innerHTML = '';
  if(Object.keys(totals).length === 0){
    pyramid.classList.add('empty');
  } else {
    pyramid.classList.remove('empty');
  }

  const pyramidDefs = {}
  pyramidDefs.fmat = [
    [['SoldierSupplies', 200], ['Cloth', 1500]],
    [['RifleLightW,RifleW', 100], ['RifleAmmo', 200], ['Bandages', 200]],
    [['ATGrenadeW,StickyBomb', 60], ['GreenAsh', 100], ['FirstAidKit', 30], ['TraumaKit', 30], ['BloodPlasma', 150], ['MedicUniformW', 30]],
    [['HEGrenade', 80], ['GasMask', 60], ['GasMaskFilter', 100], ['SMGW', 60], ['SMGAmmo', 160], ['GrenadeW', 80], ['WorkWrench', 20], ['SnowUniformW', 20]],
    [['RpgW,RPGTW', 15], ['RpgAmmo', 75], ['ATRPGTW,ATRifleW', 15], ['ATRPGAmmo,ATRifleAmmo', 60], ['Tripod', 20], ['Shovel', 20], ['AmmoUniformW', 30]],
    [['MGW,MGTW', 10], ['MGAmmo', 60], ['RifleLongW', 30], ['Bayonet', 60], ['GrenadeAdapter', 20], ['Radio', 25], ['Binoculars', 20], ['ATAmmo', 60]],
    [['Mortar', 15], ['MortarAmmo', 100], ['MortarAmmoFL', 100], ['MortarAmmoSH', 50], ['ATRPGTW', 10], ['LightTankAmmo', 100], ['TankUniformW', 30]],
    [['AssaultRifleW', 30], ['AssaultRifleAmmo', 80], ['TankMine', 50], ['BarbedWireMaterials', 40], ['SandbagMaterials',  40],  ['SatchelChargeW', 40], ['SmokeGrenade', 40], ['ScoutUniformW', 15]],
  ];
  pyramidDefs.fmatBasic = [
    [['SoldierSupplies', 100], ['Cloth', 1000]],
    [['RifleW', 60], ['RifleAmmo', 120], ['Bandages', 100]],
    [['StickyBomb', 30], ['GreenAsh', 40], ['FirstAidKit', 10], ['TraumaKit', 10], ['BloodPlasma', 50], ['MedicUniformW', 15]],
    [['HEGrenade', 40], ['GasMask', 20], ['GasMaskFilter', 40], ['SMGW', 20], ['SMGAmmo', 80], ['GrenadeW', 40], ['WorkWrench', 10]],
  ];

  const pyramidDef = pyramidDefs[definition] || pyramidDefs.fmat;
  pyramidDef.map(row => {
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('row');

    row.map(([CodeNames, desired]) => {
      // Items (including groups of items)
      let desiredCrates = desired;
      const itemNames = CodeNames.split(',');
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('item');

      let total = 0;
      let totalCrates = 0;
      for (const itemName of itemNames) {
        let item = totals[itemName];
        const catalogItem = res.CATALOG.find(e=>e.CodeName == itemName);
        const crateAmount = catalogItem.ItemDynamicData.QuantityPerCrate

        // Fallback item definition and image
        if(!item) {
          if (!catalogItem) {
            console.error(`${itemName} missing from catalog`);
            continue;
          }
          item = {
            category: (catalogItem.ItemCategory || '').replace(/^EItemCategory::/, ''),
            name: catalogItem.DisplayName || itemName,
            CodeName: itemName,
            total: 0
          };
        }
        desiredCrates = Math.ceil(desired / crateAmount);
        total += item.total;
        totalCrates += Math.floor(total / crateAmount)
        itemDiv.classList.add(item.category);
        itemDiv.title = itemDiv.title + `${item.name} or\n`

        // Icon Image
        if( item.collection ){
          itemDiv.appendChild(item.collection[0].iconBox.canvas)
        } else {
          const fallbackImg = document.createElement('img');
          fallbackImg.src = `./foxhole/inferno/icons/${item.CodeName}.png`;
          fallbackImg.width = 42;
          fallbackImg.height = 42;
          fallbackImg.alt = item.name;
          itemDiv.appendChild(fallbackImg);
        }
      }
      // Finish Icon Grouping
      const labelSpan = document.createElement('span');
      if(format === 'required'){
        labelSpan.textContent = `${desired - total}`;
      } else if(format === 'crates'){
        labelSpan.textContent = `${Math.ceil((desiredCrates - totalCrates))}c`;
      } else if(format === 'current'){
        labelSpan.textContent = `${total}`;
      } else {
        labelSpan.textContent = `${total} / ${desired}`;
      }
      itemDiv.appendChild(labelSpan);
      itemDiv.title = itemDiv.title.trim().slice(0, -2).trim();

      // Status
      if(total < desired / 2) {
        itemDiv.classList.add('depleted');
      } else if (total < desired) {
        itemDiv.classList.add('low');
      } else {
        itemDiv.classList.add('full');
      }
      rowDiv.appendChild(itemDiv);
    });
    pyramid.appendChild(rowDiv);
  });
  // Pyramid  end

  const report = document.querySelector('div.report');
  report.innerHTML = '';
  for (const category of sortedCategories) {
    const keys = categories[category];
    if (!keys) {
      continue;
    }
    keys.sort(function(a, b) {
      const crateDiff = totals[b].isCrated - totals[a].isCrated;
      if (crateDiff != 0) {
        return crateDiff;
      }
      return totals[b].total - totals[a].total;
    });

    const headerPrinted = {};
    for (const key of keys) {
      const type = totals[key];
      if (!headerPrinted[type.isCrated]) {
        if (type.isCrated || (!type.isCrated && !headerPrinted[true])) {
          const columnBreak = document.createElement('div');
          columnBreak.classList.add('column-break');
          report.appendChild(columnBreak);
        }

        const cell = document.createElement('div');
        const quantity = document.createElement('div');
        cell.appendChild(quantity);

        const name = document.createElement('h3');
        const suffix = type.isCrated ? ' (crated)' : '';
        name.textContent = category.replace(/([A-Z])/g, ' $1').trim() + suffix;
        cell.appendChild(name);
        report.appendChild(cell);

        headerPrinted[type.isCrated] = true;
      }

      const cell = document.createElement('div');
      const quantity = document.createElement('div');
      quantity.textContent = type.total;
      cell.appendChild(quantity);

      //cell.appendChild(type.collection[0].iconBox.canvas);

      const name = document.createElement('div');
      name.textContent = type.name;
      cell.appendChild(name);

      report.appendChild(cell);
    }
  }
}

export function getStockpiles() {
  return stockpiles;
}
