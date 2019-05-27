const fs = require('fs')

function getProxy () {
    let file_path = 'data/proxy/proxy.json'
    return new Promise((resolve, reject) => {
        fs.readFile(file_path, 'utf8', (err, data) => {
            if (err) reject(err)

            let file_data = JSON.parse(data)
            let proxy = file_data[0].proxy.splice(0, 1)[0]

            let json = JSON.stringify(file_data)
            
            fs.writeFile(file_path, json, 'utf8', (err) => {
                if (err) reject(err)
            })

            return resolve(proxy)
        })
    })
}

module.exports.getProxy = getProxy