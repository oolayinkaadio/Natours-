import axios from 'axios';
import {
    showAlert
} from './alert'


export const updateSettings = async({
    data
}, type) => { // d "type" can be either d name, password or email from the forms on the "account.pug"
    try {
        const url = type === 'password' ? 'http://127.0.0.1:3000/api/v1/users/updateMypassword' : 'http://127.0.0.1:3000/api/v1/users/updateme'
        const res = await axios({
            method: 'PATCH',
            url,
            data
        });
        if (res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()} updated successfully!`);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};