//const rtt = 1*60*1000; // round-trip time 20 minutes [ms]

function fractionate(thisInk, target) {
    // target is actually timeDiff(firstInk, lastInk)
    let current = new Date(thisInk) - new Date(firstInkTime);
    let f = current/target;
    //console.log("f", f)
    let colour = `hsl(${f * 300},100%,50%)`; // We don't want to come all the way around as this would create ambiguity
    return(hslToHex(f * 300, 100, 50));
}

// https://stackoverflow.com/a/44134328
function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

async function getEntries(file, options) {
    return (new zip.ZipReader(new zip.BlobReader(file))).getEntries(options);
}

filePicker = document.getElementById('filePicker');
convertBtn = document.getElementById('convertBtn');

filePicker.addEventListener('change', function (event) {
    loadPpt(event.target.files[0]);
});

loadPpt(filePicker.files[0])

parser = new DOMParser();
serialiser = new XMLSerializer();

async function loadPpt(file) {
    entries = await getEntries(file, {});
    console.log(entries);

    // Split entries into inks and EverythingElse
    inks = entries.filter(entry => entry.filename.startsWith("ppt/ink/"));
    console.log(inks);
    everythingElse = entries.filter(entry => !entry.filename.startsWith("ppt/ink/"));
    console.log(everythingElse);

    // Log the content of the first ink file
    //console.log(await inks[0].getData(new zip.TextWriter()));
    ink1 = await inks[0].getData(new zip.TextWriter());
    // parse xml
    xmlDoc = parser.parseFromString(ink1, "text/xml");
    //console.log(xmlDoc);
    // get <inkml:brushProperty> where attribute name="color"
    brushProperty = xmlDoc.getElementsByTagName("inkml:brushProperty")[2].getAttribute("value"); // we actually need to set it to value, anyway

    // get timeString attribute of <inkml:timestamp>
    timestamp = xmlDoc.getElementsByTagName("inkml:timestamp")[0].getAttribute("timeString");
    //console.log(timestamp, brushProperty);

    // get attribute value of xpath /inkml:ink/inkml:definitions/inkml:context/inkml:timestamp
    // get attribute value of xpath /inkml:ink/inkml:definitions/inkml:context/inkml:brushProperty[@name="color"]

    // evaluate XPath
    //test = xmlDoc.evaluate("//timestamp", xmlDoc, null, XPathResult.ANY_TYPE, null);
    //console.log(test);



    let firstInk = inks.filter(entry => entry.filename === "ppt/ink/ink1.xml")[0];
    let lastInk = inks.filter(entry => entry.filename === `ppt/ink/ink${inks.length}.xml`)[0]; // one-based filename

    firstInkTime = await firstInk.getData(new zip.TextWriter()).then(xml => parser.parseFromString(xml, "text/xml").getElementsByTagName("inkml:timestamp")[0].getAttribute("timeString"));
    lastInkTime = await lastInk.getData(new zip.TextWriter()).then(xml => parser.parseFromString(xml, "text/xml").getElementsByTagName("inkml:timestamp")[0].getAttribute("timeString"));

    timeDiff = (new Date(lastInkTime) - new Date(firstInkTime)) || 1;

    changeInks(inks, everythingElse) 
        .then(downloadFile);
    
}


async function changeInk(ink) {
    let xml = await ink.getData(new zip.TextWriter());
    let xmlDoc = parser.parseFromString(xml, "text/xml");
    let timestamp = xmlDoc.getElementsByTagName("inkml:timestamp")[0].getAttribute("timeString");
    let newColour = fractionate(timestamp, timeDiff);
    //console.log(ink.filename);
    xmlDoc.getElementsByTagName("inkml:brushProperty")?.[2]?.setAttribute("value", newColour);
    //console.log(newColour);
    return(serialiser.serializeToString(xmlDoc.documentElement));
}

async function changeInks(inks, everythingElse) {
    const zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"));
    promises = []
    for(let ink of inks) {
        promises.push(zipWriter.add(ink.filename, new zip.TextReader(await changeInk(ink))));
    }
    for(let entry of everythingElse) {
        promises.push(zipWriter.add(entry.filename, new zip.BlobReader(await entry.getData(new zip.BlobWriter()))));
    }

    await Promise.all(promises);
    return zipWriter.close();
}

// https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
function downloadFile(blob) {
    var element = document.createElement('a');
    element.setAttribute('href', URL.createObjectURL(blob));
    element.setAttribute('download', "test.pptx");
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }