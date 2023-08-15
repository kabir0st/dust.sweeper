import { NextResponse } from "next/server";
import { fetchGas, getWalletInfo } from "./logics";


export async function GET(request) {
    var address = request.nextUrl.searchParams.get('address')
    var dust = request.nextUrl.searchParams.get('dust')
    if (!address) {
        return NextResponse.json({ msg: "Address required." }, { status: 400 })
    }
    if (!dust) {
        dust = 0
    }
    var response = await getWalletInfo(address, dust)
    response['gas'] = await fetchGas()

    response.tokenData.forEach(tokenEntry => {
        const balance = parseFloat(tokenEntry.balance);
        const tokenSymbol = tokenEntry.tokenMetadata.symbol;
        const tokenPrice = response.price_info[tokenSymbol.toLowerCase()];

        if (tokenPrice) {
            const usdValue = (balance * tokenPrice.usd).toFixed(2);
            tokenEntry.USDValue = usdValue;
        } else {
            tokenEntry.USDValue = 0; // Token price not available
        }
    });
    return NextResponse.json(response)
}
