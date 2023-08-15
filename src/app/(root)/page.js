"use client"
import { Box, Button, Input } from '@mui/joy'
import { ethers } from 'ethers';
import { useState } from 'react';
import Grid from '@mui/joy/Grid';
import TokenTable from '../../components/table';

export default function Home() {
    const [dustValue, setDustValue] = useState(1); // State to hold input value
    const [values, setValues] = useState(null);
    const [loadingMetaMask, setLoadingMetaMask] = useState(false);
    const [loading, setLoading] = useState(false);

    const [address, setAddress] = useState('');
    const [signer, setSigner] = useState('');

    async function connectWithMetamask() {
        setLoadingMetaMask(true);
        console.log('here')
        try {
            if (!window.ethereum) {
                window.alert("Please install MetaMask first.");
                return;
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const publicAddress = await signer.getAddress();
            setSigner(signer);
            setAddress(publicAddress);
        } catch (err) {
            console.log("Error with signing, please try again.", err);
        }
        setLoadingMetaMask(false);
    }

    async function searchForDust() {
        setLoading(true);
        const apiUrl = `/api/tokens?address=${address}&dust=${dustValue}`;
        const response = await fetch(apiUrl, { method: 'GET' });
        const responseData = await response.json();
        setValues(responseData)
        setLoading(false);
    }


    return (
        <main className="px-10 py-24">
            <div className='flex justify-between items-center space-x-6'>

                <h1 className='text-6xl py-12'>
                    Sweeper
                </h1>
                <Button
                    className='connect-button'
                    variant="solid"
                    loading={loadingMetaMask}
                    onClick={() => { connectWithMetamask() }}>
                    Connect with MetaMask
                </Button>
            </div>


            <Box sx={{ m: -1.5 }}>
                <Grid container
                    spacing={3}>
                    <Grid
                        xs={12}
                        md={6}
                    >
                        <Input
                            color="neutral"
                            size="md"
                            placeholder='Wallet Address'
                            variant="outlined"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </Grid>
                    <Grid
                        xs={12}
                        md={3}
                    >
                        <Input
                            type='number'
                            color="neutral"
                            size="md"
                            placeholder='USD Value'
                            variant="outlined"
                            value={dustValue}
                            onChange={(e) => setDustValue(e.target.value)}
                        />
                    </Grid>
                    <Grid
                        xs={12}
                        md={3}
                    >
                        <Button
                            color="success"
                            variant="solid"
                            loading={loading}
                            onClick={() => { searchForDust() }}>
                            Search for Dust
                        </Button>
                    </Grid>

                    {values && <Grid
                        xs={12}
                        md={12}>
                        <TokenTable data={values} />
                    </Grid>}

                </Grid>
            </Box>
        </main >
    )
}
