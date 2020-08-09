import callApi from '@utils/callApi';
import {AppThunk} from '@store/types';
import * as types from '../types';

export const login = (user: object): AppThunk => async (dispatch): Promise<object> => {
	const data = await callApi.post('/auth/login', user);

	if (data.success) {
		localStorage.setItem('token', data.token);

		dispatch({
			type: types.LOGIN,
			payload: {
				user: data.user,
				token: data.token,
			},
		});
	}

	return data;
};

export const sendCode = (userId: string, code: string): AppThunk => async (
	dispatch,
): Promise<object> => {
	const data = await callApi.post('/auth/login/code', {userId, code});

	if (data.success) {
		localStorage.setItem('token', data.token);

		dispatch({
			type: types.LOGIN,
			payload: {
				user: data.user,
				token: data.token,
			},
		});
	}

	return data;
};

export const changeTwoFactorAuth = (): AppThunk => async (dispatch, getState): Promise<void> => {
	const userId = getState().auth.user._id;

	const data = await callApi.get(`/users/two_factor_auth/${userId}`);

	if (data.success) {
		dispatch({
			type: types.TWO_FACTOR_AUTH,
		});
	}
};

export const exit = (): types.AuthActionTypes => {
	localStorage.removeItem('token');

	return {
		type: types.EXIT,
	};
};

export const verify = (): AppThunk => async (dispatch): Promise<void> => {
	const data = await callApi.get('/auth/verify');

	if (data.success) {
		dispatch({
			type: types.LOGIN,
			payload: {
				user: data.user,
			},
		});
	} else {
		dispatch(exit());
	}
};
