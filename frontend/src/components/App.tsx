import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import { Home } from './home-page/HomePage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { CreateSetPage } from './CreateSetPage';

interface SetItem {
  card_num: number;
  description: string;
  name: string;
  owner: string;
  key: string;
}

interface SetContextType {
  set: SetItem;
  setSet: React.Dispatch<React.SetStateAction<SetItem>>;
}

export const SetContext = React.createContext<SetContextType | undefined>(undefined);


  const App: React.FC = ({}) => {
  const [set, setSet] = React.useState<SetItem>({
    card_num: 0,
    description: '',
    name: '',
    owner: '',
    key: '',
  });

  const theme = createTheme({
    palette: {
      primary: {
        main: '#0b3d91',
      },
      secondary: {
        main: '#FCFCFC',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <SetContext.Provider
        value={{set, setSet}}
      >
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/create-set" element={<CreateSetPage />} />
          </Routes>
        </BrowserRouter>
      </SetContext.Provider>
    </ThemeProvider>
  );
};

export default App;