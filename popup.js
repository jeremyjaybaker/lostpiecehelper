
let usernameField = document.getElementById('usernameField');
let passwordField = document.getElementById('passwordField');
let apiKeyField = document.getElementById('apiKeyField');
let loginErrorContainer = document.getElementById('loginError');
let loginForm = document.getElementById('loginForm');

// Convert object to URL query string
function querySerialize(obj) {
  var str = [];
  for (var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}

// Simple check for whether an object is blank or not
// https://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
function isBlankObj(obj) {
  // because Object.keys(new Date()).length === 0;
  // we have to do some additional check
  return obj // 👈 null and undefined check 
    && Object.keys(obj).length === 0
    && Object.getPrototypeOf(obj) === Object.prototype;
}

// Build a full API URL given a path and optional params
function url(path, params = {}) {
  const baseURL = "https://rebrickable.com/api/v3";
  let url = [baseURL, path].join("/");

  // Trailing slashes are needed or strange error messages will be returned!!
  if(isBlankObj(params)) {
    return url + '/';
  } else {
    return url + "?" + querySerialize(params) + '/';
  }
}

// Returns a base path for either a lego or user type query
function _getQueryPath(path, type, token) {
  if(type == 'lego') {
    return "lego/" + path;
  } else if (type == 'user') {
    return ["users", token, path].join("/");
  } else {
    // log error
  }
}

async function query(path, method, type, params) {
  chrome.storage.sync.get(["apiKey", "token"], ({ apiKey, token }) => {
    let fullPath = _getQueryPath(path, type, token);
    let body = undefined;

    if(method == "GET") {
      fullPath = fullPath + "?" + querySerialize(params)
    } else {
      body = querySerialize(params)
    }

    fetch(url(fullPath), {
      method,
      body,
      headers: {
        'Authorization': 'key ' + apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    })
  });
}

async function userQuery(path, method, params = {}) {
  query(path, method, 'user', params)
}

async function legoQuery(path, method, params = {}){
  query(path, method, 'lego', params)
}

// Exchanges credentails for a user token thats used for userQuery.
// Saves the returned token and API key to local storage.
async function login(apiKey, username, password, onComplete) {
  const response = await fetch(url("users/_token"), {
    method: 'POST',
    body: querySerialize({
      username: username,
      password: password
    }),
    headers: {
      "Authorization": 'key ' + apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    }
  });
  
  // error objects are expected to contain a "detail" key
  response.json()
  .then(
    data => onComplete({
      success:  response.status == 200,
      apiKey:   apiKey,
      token:    data.user_token,
      error:    response.status == 200 ? undefined : data.detail
    })
  ).catch(
    data => onComplete({
      success:  false,
      apiKey:   apiKey,
      token:    undefined,
      error:    data.detail
    })
  );
}

// Validate and save credentials
loginForm.addEventListener('submit', e=>{
  e.preventDefault();

  login(
    apiKeyField.value, 
    usernameField.value, 
    passwordField.value,
    res=>{
      if(res.success) {
        chrome.storage.sync.set({
          apiKey:   res.apiKey,
          token:    res.token 
        })
        loginErrorContainer.innerHTML = "Success!";
      } else {
        loginErrorContainer.innerHTML = res.error || "Unknown error";
      }
    }
  );
});

/*showParts.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Attempt to get the current set number. Return if not found.
    const res = tab.url.match(/rebrickable\.com\/sets\/([\d-]+)/);
    if(res === null) {
        alert('Unknown set. To use this feature, first navigate to a set page on Rebrickable.');
        return;
    }
    const setNum = res[1];

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        code: 'var setNum = "' + setNum + '"',
        function: queryMissingPartsBySetNumber
    });
});
  
function queryMissingPartsBySetNumber() {
    chrome.storage.sync.get("apiKey", ({ apiKey }) => {
        if(apiKey == '') {
            alert('Please set your Rebrickable API key');
        } else {
            // setNum
        }
    });
}*/