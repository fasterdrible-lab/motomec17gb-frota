import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// createRoot (renderer concorrente do React 18) fica em branco sem nenhum erro em
// algumas WebViews Android (reproduzido no app empacotado com Capacitor). A API legada
// ReactDOM.render funciona corretamente no navegador e na WebView, e o app nao usa
// nenhum recurso concorrente (Suspense/useTransition), entao nao ha perda de funcionalidade.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Erro nao tratado na renderizacao:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return React.createElement(
        'pre',
        { style: { color: '#b91c1c', padding: 16, whiteSpace: 'pre-wrap', fontSize: 12 } },
        'Ocorreu um erro: ' + this.state.error.message
      );
    }
    return this.props.children;
  }
}

ReactDOM.render(
  React.createElement(React.StrictMode, null,
    React.createElement(ErrorBoundary, null,
      React.createElement(App)
    )
  ),
  document.getElementById('root')
);
