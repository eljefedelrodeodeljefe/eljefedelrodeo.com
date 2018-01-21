---
title: "Deep Map Object Values"
date: 2018-01-20T16:39:09+01:00

categories: ['code', 'helpers']
tags: ['javascript', 'utilities', 'objects']
author: "eljefedelrodeodeljefe"
noSummary: false
draft: false
---

Given a deep object, for example a frontend feature flag map, you might want to allow all flags to be `true` in development and have the actual value only when built.

<!--more-->

<details><summary><b>TL;DR</b></summary>
<p>

```js
function mapObject (obj, fn) {
  return Object.keys(obj).reduce(
    (res, key) => {
      res[key] = fn(obj[key])
      return res
    },
    {}
  )
}

function deepMap (obj, fn) {
  const deepMapper = val => (typeof val === 'object' ? deepMap(val, fn) : fn(val))

  if (Array.isArray(obj)) {
    return obj.map(deepMapper)
  }

  if (typeof obj === 'object') {
    return mapObject(obj, deepMapper)
  }

  return obj
}

module.exports = deepMap
```

</p>
</details>

## Prelude: A Feature Flagging Implementation

Imagine a SPA that has those constants and environment variables that will be defined by the built pipeline as `process.env` globals and uses a feature flagging library like React [Flag](https://github.com/garbles/flag) or any implmenetation similar to [Martin Fowlers classic](https://martinfowler.com/articles/feature-toggles.html).

```js
const { inDevelopEnvironment } = require('../utils/env')
const { deepMap } = require('../utils/objects/map')

const FLAGS = {
  features: {
    login: {
      passwordForgotten: true
    },
    globalSearch: true,
    settings: {
      general: {
        general: false,
        vouchers: true,
        profile: false,
        payments: false
      },
      security: false
    },
    products: false,
    accounts: function () {
      // something more elaborate here
      return false
    }
  },
  pages: {
    login: {
      passwordForgotten: false
    }
  }
}

function getFlags () {
  if (inDevelopEnvironment() && process.env.FLAGS !== 'true')
  return FLAGS
}

export const flags = getFlags()
```

Conveneniently we allow us to simply run `npm start` and the whole app will be displayed. Running `FLAGS=true npm start` or any other `NODE_ENV` than `development` shows what the user will see.

Hence `inDevelopEnvironment` is defined as

```js
export function inDevelopEnvironment () {
  return process.env.NODE_ENV === 'development'
}
```

## The Solutions

Now, the problem is that JavaScript does not have a any primitive yet, to map through all the keys or values of an object. There are many StackOverflow suggestions, which I list below.

### #1: Modern JavaScript

For the above case, the one with the least assumptions about your application logic and inputs, as well as the most readable, is the following, by [geoffroy-warin](https://stackoverflow.com/users/1639063/geoffroy-warin) you can find [here](https://stackoverflow.com/a/39209226/3580261), to [this question](https://stackoverflow.com/questions/25333918/js-deep-map-function).

```js
export function mapObject (obj, fn) {
  return Object.keys(obj).reduce(
    (res, key) => {
      res[key] = fn(obj[key])
      return res
    },
    {}
  )
}

export function deepMap (obj, fn) {
  const deepMapper = val => (typeof val === 'object' ? deepMap(val, fn) : fn(val))

  if (Array.isArray(obj)) {
    return obj.map(deepMapper)
  }

  if (typeof obj === 'object') {
    return mapObject(obj, deepMapper)
  }

  return obj
}
```

### #2: The `JSON.stringify` way, for the lulz

`JSON.stringify` is an extremely powerful tool, but admittedly also the seemingly most hacky and littlest expressive one. However, let's see some for old time's sake.

We gonna make use of `JSON.stringify`'s `replacer` feature. Head over to [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) if you like.

```js
export function deepMap (obj, fn) {
  function replacer (key, value) {
    if (typeof value !== 'object') {
      return fn(value)
    }

    return value
  }
  return JSON.parse(JSON.stringify(obj, replacer))
}
```

See a working version [here](https://jsbin.com/vexofuc/3/edit?js,console).

> __NOTE:__ This will not preserve non JSON supported keys and values.
