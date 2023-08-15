import { Alchemy, Network } from "alchemy-sdk";

const networks = ['eth_sepolia', 'eth_goerli', 'eth_mainnet', 'matic', 'matic_mumbai']

function hexWeiToFloatEth(hexWei) {
    try {
        return parseInt(hexWei, 16) / Math.pow(10, 18)
    } catch (error) {
        console.error("Invalid hex wei value.");
        return null;
    }
}


const configs = {
    eth_sepolia: {
        apiKey: "az5hDz5kKyHkIGFtO_wNbI1w5cz7-Fpv",
        network: Network.ARB_MAINNET,
    },
    eth_goerli: {
        apiKey: "f_hKyHiJQnIa-JnL8CXO9kGTBV-WiJIr",
        network: Network.ETH_GOERLI,
        coinID: 'goerli-eth'
    },
    eth_mainnet: {
        apiKey: "f_hKyHiJQnIa-JnL8CXO9kGTBV-WiJIr",
        network: Network.ETH_MAINNET,
        coinID: 'ethereum'
    },
    matic: {
        apiKey: "3QjudtA0ncEBityns5tO-pe-85z6Xutp",
        network: Network.MATIC_MAINNET,
        coinID: 'matic-network'
    },
    matic_mumbai: {
        apiKey: "VZlmnWLeQ9DoHp4T_IEaFnkskGMH0tWo",
        network: Network.OPT_MAINNET
    }
}

function generateAlchemyConnectionPool(configs) {
    var connections = {}
    networks.forEach((network) => {
        connections[network] = new Alchemy(configs[network])
    })
    return connections
}

const connectionPool = generateAlchemyConnectionPool(configs)

async function fetchCryptoPrice(tokenData, currency = 'usd') {
    const namesArray = [];

    tokenData.forEach(item => {
        if (item.tokenMetadata && item.tokenMetadata.symbol && !item.tokenMetadata.symbol.includes('http') && !item.tokenMetadata.symbol.includes(' ')) {
            namesArray.push(item.tokenMetadata.symbol);
        }
    });

    try {
        const cryptoIds = namesArray.join(',');

        const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=${currency}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return { "ethereum": { "usd": 1841.58 }, "goerli-eth": { "usd": 0.128256 }, "link": { "usd": 26.92 }, "matic-network": { "usd": 0.677958 } }

    }
}


export async function getWalletInfo(address, dust) {

    const tokenData = [];
    const promises = networks.map(async (network) => {
        const ff = await connectionPool[network].core.getTokenBalances(address);
        var network_balance = await connectionPool[network].core.getBalance(address, "latest");

        tokenData.push(
            {
                'tokenMetadata': {
                    "decimals": null,
                    "logo": null,
                    "name": network,
                    "symbol": configs[network]?.coinID ? configs[network]?.coinID : network
                },
                'balance': hexWeiToFloatEth(network_balance._hex),
                'network': network
            }
        )
        for (let token of ff.tokenBalances.filter((token) => {
            return parseInt(token.tokenBalance, 16) > 0;
        })) {
            let balance = token.tokenBalance;
            const metadata = await connectionPool[network].core.getTokenMetadata(token.contractAddress);
            balance = balance / Math.pow(10, metadata.decimals);
            balance = balance.toFixed(2);
            if (balance > dust) {
                tokenData.push({
                    'tokenMetadata': metadata,
                    'balance': balance,
                    'network': network
                })
            }

        }
        return tokenData;
    });
    await Promise.all(promises);

    const prices = await fetchCryptoPrice(tokenData)
        .then(prices => {
            return prices; // Display fetched crypto prices
        })
        .catch(error => {
            console.error('Error:', error);
            return {};
        });
    return { tokenData: tokenData, price_info: prices }
}


export async function fetchGas() {
    const url = "https://stgapi.gweistation.io/api/v2/tracker/gas_estimate/"
    const response = await fetch(url);
    const data = await response.json();
    return data
}