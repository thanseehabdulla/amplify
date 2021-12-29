/* eslint-disable import/no-cycle */
import { Auth } from 'aws-amplify';
import {
  addCurrentAccessLevel,
  addCurrentAccessList,
  addCurrentEmail,
  addCurrentOrg,
  enableIsAuthenticated,
  removeCurrentAccessLevel,
  saveToken,
  disableIsAuthenticated,
  removeToken,
  addCurrentEmployee,
  addCurrentRS,
  removeCurrentEmail,
  addCurrentEmployeeName,
} from 'utils/localStorage';
import { RouteComponentProps } from 'react-router-dom';
import { defaultPage } from 'app/routes/default';
import { Notification } from './notification';
import { jwtInterceptor } from './https';

export async function forgotPasswordSubmit(code: string, email: string, new_password: string) {
  await Auth.forgotPasswordSubmit(email, code, new_password)
    .then(() => {
      Notification('Success', 'Password Changed Successfully', 'success');
      window.location.href = '/login';
    })
    .catch((err) => {
      Notification('Failed', err.message, 'danger');
    });
}

export async function ValidatePasswordSubmit(code: string, email: string, new_password: string) {
  await Auth.forgotPasswordSubmit(email, code, new_password)
    .then(() => {
      Notification('Success', 'Password Changed Successfully, Login to continue', 'success');
      removeCurrentEmail();
      window.location.href = '/login';
    })
    .catch((err) => {
      Notification('Failed', err.message, 'danger');
    });
}

export async function forgotPassword(email: string) {
  return Auth.forgotPassword(email)
    .then((res) => {
      return res;
    })
    .catch((err) => {
      Notification('Failed', err?.message, 'danger');
    });
}

export function refreshToken() {
  Auth.currentSession()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .then((data: any) => {
      saveToken(data.idToken.jwtToken);
      jwtInterceptor();
      window.location.reload();
    })
    .catch(() => {
      disableIsAuthenticated();
      removeToken();
      jwtInterceptor();
      window.location.href = '/login';
    });
}

export async function verifySignIn(username: string, password: string) {
  return Auth.signIn(username, password);
}

export async function signIn(username: string, password: string, history: RouteComponentProps['history']) {
  await Auth.signIn(username, password)
    .then((res) => {
      enableIsAuthenticated();
      saveToken(res.signInUserSession.idToken.jwtToken);
      jwtInterceptor();
      addCurrentAccessLevel(res.attributes['custom:accessLevel']);
      addCurrentAccessList({ name: res.attributes['custom:accessLevel'] }).then(() => {
        Auth.currentUserInfo().then((da) => {
          addCurrentEmployee(da?.attributes['custom:code']);
          addCurrentEmail(username);
          addCurrentEmployeeName(da?.attributes['name']);
          addCurrentOrg(da?.attributes['custom:organizationCode']);
          addCurrentRS(da?.attributes['custom:rsCode']);
          Notification('Sign In', 'Sign in successful', 'success');
          history.push(defaultPage());
        });
      });
    })
    .catch((err) => {
      if (err?.message === 'User is disabled.' || err?.message === 'User is not confirmed.') {
        addCurrentEmail(username);
        history.push('/verify-email');
      } else {
        Notification('Failed', err?.message, 'danger');
      }
    });
}

export async function confirmSignUp(code: string, email: string) {
  await Auth.confirmSignUp(email, code)
    .then(() => {
      const newLocal = 'Successfully verified user';
      alert(newLocal);
      window.location.href = '/login';
      removeCurrentAccessLevel();
    })
    .catch((err) => {
      alert(err?.message);
    });
}

export async function confirmVerifyEmail(code: string, email: string) {
  await Auth.confirmSignUp(email, code)
    .then(() => {
      window.location.href = '/verify-user';
    })
    .catch((err) => {
      Notification('Failed', err?.message, 'danger');
    });
}

export async function signUp(email: string, password: string, attributes: Record<string, unknown>) {
  return Auth.signUp({
    username: email,
    password,
    attributes,
  })
    .then((res) => {
      Notification('New use created', 'Password and verification code sent over mail', 'success');
      return res;
    })
    .catch((err) => {
      Notification('Error', err?.message, 'danger');
    });
}

export async function signOut() {
  try {
    await Auth.signOut();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('error signing out: ', error);
  }
}
