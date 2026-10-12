import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

type ColorMode = 'light' | 'dark'

interface ColorModeContextType {
    mode: ColorMode
    toggleColorMode: () => void
    setColorMode: (mode: ColorMode) => void
}

const ColorModeContext = createContext<ColorModeContextType>({
    mode: 'light',
    toggleColorMode: () => { },
    setColorMode: () => { },
})

export const useColorMode = () => useContext(ColorModeContext)

export const CustomThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<ColorMode>(() => {
        const saved = localStorage.getItem('theme_mode')
        if (saved === 'dark' || saved === 'light') return saved
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
    })

    useEffect(() => {
        localStorage.setItem('theme_mode', mode)
        const root = document.documentElement
        if (mode === 'dark') {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
    }, [mode])

    const toggleColorMode = () => {
        setMode((prev) => (prev === 'light' ? 'dark' : 'light'))
    }

    const setColorMode = (newMode: ColorMode) => {
        setMode(newMode)
    }

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    primary: {
                        main: mode === 'dark' ? '#316bf3' : '#0051d5',
                    },
                    secondary: {
                        main: '#ffb300',
                    },
                    background: {
                        default: mode === 'dark' ? '#0b0f19' : '#f8f9ff',
                        paper: mode === 'dark' ? '#131b2e' : '#ffffff',
                    },
                    text: {
                        primary: mode === 'dark' ? '#f1f5f9' : '#0b1c30',
                        secondary: mode === 'dark' ? '#94a3b8' : '#565e74',
                    },
                },
                typography: {
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                },
                components: {
                    MuiPaper: {
                        styleOverrides: {
                            root: {
                                backgroundImage: 'none',
                                borderRadius: 12,
                            },
                        },
                    },
                    MuiButton: {
                        styleOverrides: {
                            root: {
                                borderRadius: 10,
                                textTransform: 'none',
                            },
                        },
                    },
                },
            }),
        [mode]
    )

    return (
        <ColorModeContext.Provider value={{ mode, toggleColorMode, setColorMode }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    )
}
