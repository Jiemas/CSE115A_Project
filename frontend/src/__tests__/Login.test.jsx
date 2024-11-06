import React from 'react';
import {it, beforeAll, afterAll, afterEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {setupServer} from 'msw/node';
import {http, HttpResponse} from 'msw';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Home } from '../components/home-page/HomePage'; 
import { expect } from 'vitest';
import App, { SetContext } from '../components/App'; 
import { LoginPage } from '../components/LoginPage'; 
import { ThemeProvider } from '@mui/material'; 

const URL = 'http://localhost:3001/v0/login'; 


const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());  

it('renders the LoginPage by default', () => {
  render(
    <MemoryRouter>
      <LoginPage create={false} loading={false} />
    </MemoryRouter>
  );
  expect(screen.getByText('Log In')).toBeInTheDocument(); 
  expect(screen.getByText('Create Account')).toBeInTheDocument(); 

});

it('Create Account button works', async () => {
  render(
    <MemoryRouter>
      <LoginPage create={false} loading={false} />
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('button', {name: 'Create Account'}));
  expect(screen.getByText('Create')).toBeInTheDocument(); 
  expect(screen.getByText('Already Have Account')).toBeInTheDocument(); 
});

it('success create account', async () => {
  render(
    <MemoryRouter>
      <LoginPage create={false} loading={false} />
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('button', {name: 'Create Account'}));
  expect(screen.getByText('Create')).toBeInTheDocument(); 
  server.use(
    http.put('http://localhost:3001/v0/login', async (req) => {
      return HttpResponse.json({ accessToken: 'fake-access-token' }, { status: 201 });
    })
  );
  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test100@example.com' } });
  fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password1' } });
  expect(screen.getByText('Create')).toBeInTheDocument(); 

  fireEvent.click(screen.getByRole('button', {name: 'Create'}));

  expect(screen.getByText('Log In')).toBeInTheDocument(); 

});


// it('Failed create account attempt', async () => {
//     let alertCalled = false;
//     window.alert = () => {
//       alertCalled = true; 
//     };
//     render(
//       <MemoryRouter>
//         <LoginPage create={false} loading={false} />
//       </MemoryRouter>
//     );
//     fireEvent.click(screen.getByRole('button', {name: 'Create Account'}));
//     server.use(
//       http.put(URL, async () => {
//         return HttpResponse.json({ accessToken: 'fake-access-token' }, { status: 401 });
//       })
//     );
//     fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test' } });
//     fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password1' } });
    
//     await waitFor(() => {
//       fireEvent.click(screen.getByRole('button', {name: 'Create'}));
//     });
//     await waitFor(() => {
//       expect(screen.getByText('Create Account')).toBeInTheDocument(); 
//     });
//     await waitFor(() => {
//       expect(alertCalled).toBeTruthy();
//     });
// });

  
  // it('navigates to Home when Login is successful', async () => {
  //     render(
  //       <ThemeProvider theme={theme}>
  //         <SetContext.Provider value={{ set, setSet }}>
  //           <MemoryRouter initialEntries={['/login']}>
  //             <Routes>
  //               <Route path="/" element={<Home />} />
  //               <Route path="/login" element={<LoginPage create={false} loading={false} />} />
  //             </Routes>
  //           </MemoryRouter>
  //         </SetContext.Provider>
  //       </ThemeProvider>
  //     );
  //     server.use(
  //       http.post(URL, async () => {
  //         return HttpResponse.json({ accessToken: 'fake-access-token' }, { status: 200 });
  //       })
  //     );
  //     fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
  //     fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password1' } });
      
      
  //     fireEvent.click(screen.getByRole('button', {name: 'Logi'}));
      
  //     await waitFor(() => {
  //       expect(screen.getByText('Rapid Review')).toBeInTheDocument(); 
  //     });
  //   });
