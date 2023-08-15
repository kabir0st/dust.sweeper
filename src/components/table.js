import { Button, ButtonGroup, Table } from '@mui/joy';
import { useState } from 'react';

const TokenTable = ({ data }) => {
    const [clickedRowIndices, setClickedRowIndices] = useState([]);
    const [speed, setSpeed] = useState('average');

    function totalUSDValue() {
        let value = 0;
        data.tokenData.forEach((token, index) => {
            if (!clickedRowIndices.includes(index)) {  // Skip clicked rows
                let usdValue = token.USDValue;
                if (usdValue == 0) {
                    usdValue = 0;
                } else {
                    usdValue = parseFloat(usdValue);
                }
                value += usdValue;
            }
        });
        return value;
    }

    const toggleRowClick = (index) => {
        if (clickedRowIndices.includes(index)) {
            setClickedRowIndices(clickedRowIndices.filter((clickedIndex) => clickedIndex !== index));
        } else {
            setClickedRowIndices([...clickedRowIndices, index]);
        }
    };

    function calculateGasSpeedMultiplier() {
        const eth_speed = data.gas.data.eth.gas[speed]
        const poly_speed = data.gas.data.polygon.gas[speed]

        const UniSwapGasLimit = 184523;

        const ethMultiplier = eth_speed * UniSwapGasLimit;
        const polygonMultiplier = poly_speed * UniSwapGasLimit;

        return {
            eth: ethMultiplier,
            polygon: polygonMultiplier
        };
    }

    function estimateTotalGasCost() {
        const gasMultiplier = calculateGasSpeedMultiplier();
        let totalGasCost = 0;

        data.tokenData.forEach((token, index) => {
            if (!clickedRowIndices.includes(index)) {
                if (parseInt(token.balance) > 0) {
                    let tokenGasCost = 0;
                    if (token.network === 'eth_goerli') {
                        console.log(token.balance, token.network)
                        tokenGasCost = gasMultiplier.eth;
                    } else if (token.network === 'matic') {
                        tokenGasCost = gasMultiplier.polygon;
                    }
                    totalGasCost += tokenGasCost;
                }

            }
        });

        return totalGasCost;
    }
    return (
        <div>
            Click to ignore value in total calculation
            <Table
                borderAxis="x"
                size="md"
                stickyFooter={false}
                stickyHeader
                variant="plain"
                hoverRow
            >
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Balance</th>
                        <th>Network</th>
                        <th>Value [USD]</th>
                    </tr>
                </thead>
                <tbody>
                    {data.tokenData.map((token, index) => (
                        <tr
                            key={index}
                            onClick={() => toggleRowClick(index)}  // Attach click event
                            className={`${clickedRowIndices.includes(index) ? 'highlighted' : ''} ${token.USDValue != 0 ? 'hasValue' : ''}`}
                        >
                            <td>{token.tokenMetadata.name}</td>
                            <td>{token.balance} {token.tokenMetadata.symbol}</td>
                            <td>{token.network}</td>
                            <td>{token.USDValue}</td>
                        </tr>
                    ))}
                    <tr style={{ backgroundColor: 'transparent' }}>
                        <td></td>
                        <td></td>
                        <td>Total USD Value: </td>
                        <td><b> {totalUSDValue()}</b></td>
                    </tr>
                    <tr style={{ backgroundColor: 'transparent' }}>
                        <td><b>Select Transaction Speed</b></td>
                        <td > <ButtonGroup aria-label="outlined primary button group">
                            <Button onClick={() => { setSpeed('slow') }}>Slow</Button>
                            <Button onClick={() => { setSpeed('average') }}>Average</Button>
                            <Button onClick={() => { setSpeed('fast') }}>Fast</Button>
                            <Button onClick={() => { setSpeed('instant') }}>Instant</Button>
                        </ButtonGroup> </td>
                        <td colSpan={2}>Estimated Gas Cost for <b>{speed.toLocaleUpperCase()} : {estimateTotalGasCost()}</b> </td>
                    </tr>
                </tbody>
            </Table>
        </div>

    );
};

export default TokenTable;
