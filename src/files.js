const fs = require('fs')

function saveAccount (in_data, fail) {
    let file_path = fail ? 'data/accounts/fails.json' : 'data/accounts/accounts.json'
    return new Promise((resolve, reject) => {
        fs.readFile(file_path, 'utf8', (err, data) => {
            if (err) reject(err)
            
            let file_data = JSON.parse(data)
            file_data.push(in_data)
            let json = JSON.stringify(file_data)
            
            fs.writeFile(file_path, json, 'utf8', (err) => {
                if (err) reject(err)
                console.log("The file was saved!")
                resolve('Ok')
            })
        })
    })
}

module.exports.saveAccount = saveAccount
