const fs = require('fs')
const path = require('path')
const Nightmare = require('nightmare')
const screenshotSelector = require('nightmare-screenshot-selector')
const cyrillicToTranslit = require('cyrillic-to-translit-js')

const Names = require('./src/names.js')
const Pwd = require('./src/passwords.js')
const Captcha = require('./src/captcha.js')
const Files = require('./src/files.js')
const Proxies = require('./src/proxy.js')


let nightmare,
    width = 800,
    height = 600,
    edgeVersion = 17083,
    chromeVersion = 3029,
    countIteration = 0

Nightmare.action('screenshotSelector', screenshotSelector)

function tmpImageRemove (filePath) {
    fs.unlink(filePath, (err) => {
        if (err) throw err;
    })
}

function botCreate () {
    console.log('------------------------------------------------------------------------')

    edgeVersion -= Math.floor(Math.random() * 1000)
    chromeVersion -= Math.floor(Math.random() * 500)
    width += Math.floor(Math.random() * 25)
    height += Math.floor(Math.random() * 50)

    Proxies.getProxy()
        .then((proxy) => {
            let useragent = 'Mozilla/5.0 (Windows IoT 10.0; Android 6.0.1; WebView/3.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.' + chromeVersion + '.110 Mobile Safari/537.36 Edge/17.' + edgeVersion
            console.log('PROXY: ' + proxy)

            if (proxy) {
                nightmare = Nightmare({
                    gotoTimeout: 60000,
                    waitTimeout: 60000,
                    loadTimeout: 60000,
                    executionTimeout: 60000,
                    typeInterval: 100,
                    pollInterval: 100,
                    webPreferences: {
                        partition: 'nopersist',
                        preload: path.resolve(__dirname, 'src/helpers/preload.js')
                    },
                    openDevTools: {
                        mode: 'detach'
                    }, 
                    show: true,
                    switches: {
                        'proxy-server': proxy,
                        'ignore-certificate-errors': true
                    }
                })
                .viewport(width, height)
                .useragent(useragent)
                
                botStart()
            }
        })
}

function botStart () {
    let captchaName = 'tmp/' + Pwd.getSimplePassword() + '.png'
    let account = {
        name: cyrillicToTranslit().transform(Names.getName()),
        surname: cyrillicToTranslit().transform(Names.getSurname()),
        pwd: Pwd.getSimplePassword() + 'a1',
        gender: 'male',
        birthday: {
            day: Math.floor(Math.random() * 20) + 1,
            month: Math.floor(Math.random() * 10),
            year: Math.floor(Math.random() * 20) + 1980
        }
    }

    account.username = account.name + account.surname

    nightmare.goto('https://account.mail.ru/signup?rf=auth.mail.ru&from=main')
        .wait('input[name="firstname"]')
        .type('input[name="firstname"]', account.name)
        .type('input[name="lastname"]', account.surname)
        .click('.b-date__day a[data-text="' + account.birthday.day + '"]')
        .click('.b-date__month a[data-num="' + account.birthday.month + '"]')
        .click('.b-date__year a[data-text="' + account.birthday.year + '"]')
        .click('.btn.btn_main.btn_responsive.btn_responsive-wide')
        .click('label[data-mnemo="sex-' + account.gender + '"]')
        .type('input[data-blockid="email_name"]', account.username)
        .type('input[name="password"]', account.pwd)
        .evaluate(() => {
            let input = document.querySelector('input[name="password_retry"]')
            let element = document.querySelectorAll('div[data-bem="b-form-row"]')[7]
            let child = document.querySelector('div[data-field-name="password_retry"]')
            element.classList.remove('b-form-row_hidden')
            child.classList.remove('b-form-field_hidden')
            input.classList.remove('b-input_hidden')
        })
        .wait(1000)
        .type('input[name="password_retry"]', account.pwd)
        .click('.js-signup-simple-link')
        .wait(1000)
        .click('button[tabindex="10"]')
        .wait('input[name="capcha"]')
        .wait(1000)
        .screenshotSelector({selector: '.b-captcha__captcha', path: captchaName})
        .wait(2000)
        .then(() => {
            function solveCaptcha() {
                return Captcha.sendCaptcha()
                    .then(response => {
                        if (response === null)
                                return solveCaptcha()

                            let captchaId = response.id
                            let solution = response.solution

                        return nightmare
                            .type('input[name="capcha"]', solution)
                            .click('button[data-name="submit"]')
                            .wait(2000)
                            .evaluate(() => {
                                let errorBlock = document.querySelector('.b-captcha__error-msg')

                                if (errorBlock)
                                    return true
                            })
                            .then(err => {
                                if (err) {
                                    console.log('Wrong captcha!')

                                    return nightmare.click('.js-captcha-reload')
                                        .wait(1000)
                                        .screenshotSelector({selector: '.b-captcha__captcha', path: captchaName})
                                        .wait(2000)
                                        .then(() => {
                                            console.log('captchaId', captchaId)
                                            if (captchaId)
                                                Captcha.sendReport(captchaId)
    
                                            return solveCaptcha()
                                        })
                                } else {
                                    return nightmare
                                        .wait('.popup__close.js-close-link')
                                        .click('.popup__close.js-close-link')
                                        .end()
                                        .then(() => {
                                            account.username = account.username + '@mail.ru'
                                            Files.saveAccount(account)
                                                .then(() => {
                                                    countIteration += 1
        
                                                    console.log('GMail was create!')
                                                    console.log('Created: ' + countIteration)
                                                    
                                                    tmpImageRemove()
                                                    botCreate()
                                                })
                                        })
                                }
                            })
                            .catch(err => {
                                return nightmare.end()
                                    .then(() => {
                                        Files.saveAccount(account, true)
                                            .then(() => {
                                                console.log('Error in the second stage: ' + err)
                                                tmpImageRemove()
                                                botCreate()
                                            })
                                    })
                            })
                    })
                    .catch(() => {
                        return nightmare.end()
                            .then(() => {
                                tmpImageRemove()
                                botCreate()
                            })
                    })
            }

            solveCaptcha()
        })
        .catch(err => {
            console.error('Error in the first stage: ' + err)

            return nightmare
                .wait(2000)
                .end()
                .then(() => {
                    botCreate()
                })
        })
}

botCreate()