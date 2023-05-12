// ==UserScript==
// @name         Animego play next
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  automatic open next video
// @icon         https://www.google.com/s2/favicons?sz=64&domain=animego.org
// @match        https://animego.org/anime/*
// @match        https://aniboom.one/*
// @match        https://kodik.info/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/MAKS11060/animego-auto-play/main/auto-play.user.js
// @downloadURL  https://raw.githubusercontent.com/MAKS11060/animego-auto-play/main/auto-play.user.js
// @homepageURL  https://github.com/MAKS11060/animego-auto-play

// ==/UserScript==

(function () {
  'use strict'

  // use custom events handler
  const players = {
    'aniboom.one': true,
    'kodik.info': false
  }

  let autoPlay = true
  let currentEpisode = 0
  let epsEl = []

  const nextEpisode = () => {
    console.log('set episode', epsEl[currentEpisode])
    epsEl[currentEpisode]?.click()
  }
  const useFS = el => {
    el.requestFullscreen().catch(r => console.error('fullscreen err', r))
  }

  const play = () => {
    if (['kodik.info'].includes(window.location.hostname)) {
      // const el = window.document.querySelector('video')
      // el.play()
      const playEl = window.document.querySelector('.play_button')
      playEl?.click()
    }

    if (['aniboom.one'].includes(window.location.hostname)) {
      let i = setInterval(() => {
        // console.log('try play()', window.location.hostname)
        const btnEl = window.document.querySelector('button[type=button]')
        btnEl?.click()

        if (btnEl) clearInterval(i)
      }, 200)

      // const el = window.document.querySelector('video')
      // el.play()
      // const playEl = window.document.querySelector('.play_button')
      // playEl?.click()
    }
  }

  if (window.top === window.self) {
    console.log('main', window)
    window.addEventListener("message", e => {
      if (!e.data) return
      if (e.data?.title === "mousemove") return // kodik
      console.log('main', e.data)

      if (e.data.event === 'ping') {
        window.top.postMessage({event: 'pong'}, '*')
        // window.top.postMessage({event: 'autoplay', value: autoPlay}, '*')
        return
      }
      if (e.data.event === 'iframe_player') {
        epsEl = [...document.querySelectorAll('div[data-episode]')]
        if (epsEl.length) {
          for (const el of epsEl) {
            // console.dir(el)
            if (el.classList.contains('video-player__active')) {
              currentEpisode = Number(el.dataset?.episode)
              console.log({currentEpisode})
              break
            }
          }
        }
        return
      }
      if (e.data.event === 'ended') {
        nextEpisode()
        return
      }

      // play
      // if (e.data.event === 'play' || e.data.title === 'resume') {
      //   autoPlay = true
      //   console.log('auto play enabled')
      //   return
      // }
    })

    window.addEventListener('keydown', e => {
      if (e.code === 'KeyF') {
        const vEl = window.document.querySelector('.video-player-online')
        useFS(vEl)
      }
    })

  } else { // in iframe context
    console.log('iframe', window)
    window.addEventListener("message", e => {
      console.log('iframe', e.data)
      // if (e.data.event === 'autoplay') {
      //   autoPlay = e.data.value
      //   if (autoPlay) play()
      // }
    })

    window.top.postMessage({event: 'ping'}, '*')
    window.top.postMessage({event: 'iframe_player', href: window.location.href}, '*')
    window.onload = e => {
      if (autoPlay) play()

      // handle ended
      if (players[window.location.hostname]) {
        const el = window.document.querySelector('video')
        console.log('frame el', el)
        el.onended = e => window.top.postMessage({event: 'ended'}, '*')
        el.onpause = e => window.top.postMessage({event: 'pause'}, '*')
        el.onended = e => window.top.postMessage({event: 'ended'}, '*')
      }
    }
  }
})()