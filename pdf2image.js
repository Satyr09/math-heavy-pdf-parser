require('dotenv').config();

const fs = require('fs');
const path = require('path');
const pdf2img = require('pdf2img');
const fetch = require("node-fetch")

const input = __dirname + '/testLatexPdf.pdf';

pdf2img.setOptions({
  type: 'png',                                // png or jpg, default jpg
  size: 1024,                                 // default 1024
  density: 600,                               // default 600
  outputdir: __dirname + path.sep + 'image_output', // output folder, default null (if null given, then it will create folder name same as file name)
  outputname: 'test',                         // output file name, dafault null (if null given, then it will create image name same as input name)
  page: null,                                 // convert selected page, default null (if null given, then it will convert all pages)
  quality: 100                                // jpg compression quality, default: 100
});

pdf2img.convert(input, async (err, info) => {
  if (err) console.log(err)
  else console.log(info);

  const promiseList = info.message.map(
    async item => {

      const imageAsBase64 = fs.readFileSync(item.path, 'base64');


      const raw = {
        "src":`data:image/png;base64,${imageAsBase64}`,
        "formats": ["text", "data", "html"],
        "data_options": {
          "include_asciimath": true,
        }
      }
      const myHeaders = new fetch.Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("app_id", process.env.APP_ID);
      myHeaders.append("app_key", process.env.APP_KEY);

      const requestOptions = {
        method: 'POST',
        body : JSON.stringify(raw),
        headers: myHeaders,
        redirect: 'follow'
      };

      const result = await fetch("https://api.mathpix.com/v3/text", requestOptions)
      return await result.text();
    }
  )

  const answer = await Promise.all(promiseList)

  const fileWritePromiseList = answer.map(async item => {
    const data = JSON.parse(item)
    console.log(data)
    return fs.promises.writeFile(__dirname+path.sep+"mathpixOutput-"+data.request_id+".json",item)
  })

  await Promise.all(fileWritePromiseList)
});