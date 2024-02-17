import fs from 'fs';
import wallet from 'ethereumjs-wallet';



const options ={
    key: process.argv[2],
    password: process.argv[3]
}

if (options && options.key)
{
    if (options.password)
    {
        const pk = new Buffer.from(options.key, 'hex') // replace by correct private key
        const account = wallet.fromPrivateKey(pk)
        const json = JSON.stringify(account.toV3(options.password))

        const file = `key.json`

        fs.writeFileSync(file, json)

        console.log(`Saved to "${file}"`)
    }
    else
    {
        console.error('Missing password')

        process.exit(1)
    }
}
else
{
    console.error('Missing key')

    process.exit(1)
}
