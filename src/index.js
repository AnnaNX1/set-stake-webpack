import { Sdk } from '@unique-nft/sdk';
import { PolkadotProvider } from '@unique-nft/accounts/polkadot';

const baseUrl = 'https://rest.quartz.uniquenetwork.dev/v1';
// const baseUrl = 'https://rest.opal.uniquenetwork.dev/v1';

async function setStake(client, address, amountInit) {
    const { decimals } = await client.common.chainProperties();
    const arr = amountInit.toString().split('.');
    let amount = arr[0] !== '0' ? arr[0] : '';
    if (arr[1]) {
        amount += arr[1] + Array(decimals - arr[1].length).fill('0').join('');
    } else {
        amount += Array(decimals).fill('0').join('');
    }

    return client.extrinsics.submitWaitResult({
        address: address,
        section: 'appPromotion',
        method: 'stake',
        args: [amount],
    });
}

const getBalanceAndStake = async (amount) => {
    const provider = new PolkadotProvider();
    await provider.init();
    const list = await provider.getAccounts();
    const signer = list[3];

    // create client
    const options = {
        baseUrl: baseUrl,
        signer,
    };
    const client = new Sdk(options);

    // весь застейченный баланс отображается в lockedBalance
    const initBalanceResponse = await client.balance.get({
        address: signer.instance.address,
    });
    console.log(initBalanceResponse);

    // set stake
    const result = await setStake(client, signer.instance.address, amount);
    console.log(result);

    if (result.error) throw new Error(result.error);

    const val = await client.stateQuery.execute({
            endpoint: 'rpc',
            module: 'appPromotion',
            method: 'totalStaked',
        },
        {args: [{ Substrate: signer.instance.address }]}
    );
    console.log(val);
};
const index = async () => {

    const form = document.querySelector('form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const amount =
            document.querySelector('#amount') &&
            document.querySelector('#amount').value;
        document.querySelector('#response').innerText = 'wait...';
        try {
            await getBalanceAndStake(amount);
            document.querySelector('#response').innerText =
                'Output:\nstaked';
        } catch (e) {
            console.log(JSON.stringify(e))
            document.querySelector('#response').innerText = 'Error';
        }
    });
};

index();
