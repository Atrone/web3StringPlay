const { Web3Storage, getFilesFromPath } =  require('web3.storage')
const minimist = require('minimist')

const abiJSON = require('./abi.json')

const fs = require('fs');

const Web3 = require('Web3')
const web3 = new Web3(new Web3.providers.HttpProvider('https://polygon-mumbai.infura.io/v3/'))

const StringCompareContract = new web3.eth.Contract(abiJSON.output.abi, '0xC629D9bab4BaE7DdBB551F7E9A49625ac652238a')
const args = minimist(process.argv.slice(2))
const token = args.token
const firstWord = args.firstWord
const secondWord = fs.readFileSync('./text.txt', 'utf8');

const char = parseInt(args.char)
const storage = new Web3Storage({ token })
const d = new Date();
let textD = d.getFullYear().toString().concat(d.getMonth().toString()).concat(d.getDate().toString()).concat(d.getTime().toString())
console.log(firstWord);
console.log(secondWord);
const filename = textD.concat('.txt')
var cid = "";
fs.appendFile(filename, "", function (err) {
  if (err) throw err;
  console.log('Saved!');
});


async function readFromCID(){
  var res = await storage.get(cid); // Web3Response
  var resKvPairs = await (await res.files()).entries();
  for (const [key, value] of resKvPairs) {
    console.log(`${value.name}: ${await value.text()}`);
  }

}

async function retrieveCurrentState(){
  var uploadNames = [];
  var retrievedFile = [];
  for await (const item of storage.list({ maxResults: 1 })) {
    uploadNames.push(item.cid);
  }    // Return the cid of last upload
  if(uploadNames.length != 0)
  {
    var res = await storage.get(uploadNames[0]); // Web3Response
    var retrievedFile = await res.files(); // Web3File[]
  }
  return retrievedFile;
}

async function deleteLocalFile(){
  fs.unlinkSync (filename, (err) => {
    if (err) {
      console.error(err)
      return
    }
    //file removed
  })

}

async function storeInWeb3Storage(localFiles) {

    var currentState = await retrieveCurrentState()
    var newFiles = localFiles.concat(currentState)
    console.log(`Uploading ${newFiles.length} files`)
    cid = await storage.put(newFiles) // calls EVM  
    console.log('Content added with CID:', cid)
    return cid;
}

async function mainLogic () {
  if (!token) {
    return console.error('A token is needed. You can create one on https://web3.storage')
  }

  var contains = await StringCompareContract.methods.ContainWord(firstWord,secondWord).call();
  if(contains)
  {   
      console.log(char-1);
      var firstCharOfSecondWord = await StringCompareContract.methods.Substring(firstWord,char-1,char).call();
      var startTime = performance.now()
      var howManyTimesFirstCharIsRepeated = (await StringCompareContract.methods.HowManyRepeated(firstCharOfSecondWord,secondWord).call()).toString(); // calls EVM
      var endTime = performance.now()
      console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)
      var toSave = "This run found that the first word was in the second word and character ".concat(char.toString()).concat(" of that first word was repeated ").concat(howManyTimesFirstCharIsRepeated).concat(" times in the second word. ")

      fs.appendFile(filename, toSave, function (err) {
        if (err) throw err;
      });
  }
  if(!contains)
  {
      var toSave = "This run found that the first word was not in the second word. "

      fs.appendFile(filename, toSave, function (err) {
        if (err) throw err;
      });
  }
  console.log('Computation Done!');
  const localFiles = []
  var pathFiles = await getFilesFromPath(filename)
  localFiles.push(...pathFiles)
  await readFromCID(await storeInWeb3Storage(localFiles))
  await deleteLocalFile()
}




mainLogic()
