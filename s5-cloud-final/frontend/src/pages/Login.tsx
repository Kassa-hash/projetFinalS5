import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonToast,
  IonLoading,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoading, setShowLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  const handleLogin = async () => {
    if (!email || !password) {
      setToastMessage('Veuillez remplir tous les champs');
      setShowToast(true);
      return;
    }

    setShowLoading(true);
    try {
      // Déterminer l'URL de l'API (localhost pour navigateur, 10.0.2.2 pour émulateur Android)
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:8000/api/firebase/login'
        : 'http://10.0.2.2:8000/api/firebase/login'; // Pour l'émulateur Android

      // Send credentials to Laravel backend
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Identifiants incorrects ou erreur serveur');
      }

      console.log('Backend response:', data);

      // Store user info/token if needed and redirect
      localStorage.setItem('user', JSON.stringify(data));
      
      setToastMessage('Connexion réussie !');
      setShowToast(true);
      
      // Redirect to home page
      history.push('/tab1');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Impossible de contacter le serveur. Assurez-vous que le backend Laravel est lancé.';
      if (error.message && error.message !== 'Failed to fetch') {
        errorMessage = error.message;
      }
      setToastMessage(errorMessage);
      setShowToast(true);
    } finally {
      setShowLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Connexion</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Email</IonLabel>
          <IonInput
            type="email"
            value={email}
            onIonInput={(e) => setEmail(e.detail.value!)}
            placeholder="votre@email.com"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Mot de passe</IonLabel>
          <IonInput
            type="password"
            value={password}
            onIonInput={(e) => setPassword(e.detail.value!)}
            placeholder="******"
          />
        </IonItem>

        <IonButton expand="block" onClick={handleLogin} className="ion-margin-top">
          Se connecter
        </IonButton>

        <IonLoading isOpen={showLoading} message={'Connexion en cours...'} />
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
