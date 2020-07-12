import axios from 'axios';
import {
    showAlert
} from './alert'
const stripe = Stripe('pk_test_51GuhSWISjF6A7AvFC9H3B56S4n7PRSn6p67ffNfZ8aiFeuE1j10GNHW0H3Lrke7tos0XWF9WjuuJ1XcmUdo2N20T00IV1HNwB5');
export const bookTour = async(tourId) => {
    try {
        // 1) Get checkout session from API
        const session = await axios(
            `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
        );
        console.log(session)

        // 2) Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id,
        });
    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }
};