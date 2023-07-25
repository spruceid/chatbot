import { IconUser } from '@tabler/icons-react';
import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useApiService from '@/services/useApiService';
import HomeContext from '@/pages/api/home/home.context';
import { SidebarButton } from '@/components/Sidebar/SidebarButton';
import { useSSX } from '@/components/_ssx';
import { SignInButton } from './SignInButton';
import ChatbarContext from '../Chatbar.context';
import Spinner from '@/components/Spinner/Spinner';

enum ModalState {
  SignIn,
  CreateVault,
  OpenAIKey,
  None,
}

const STORAGE_OPENAI_API_KEY_NAME = 'openai-api-key';

export const SSX = () => {
  const { ssx, signingIn } = useSSX();
  const { t } = useTranslation('sidebar');

  const {
    state: { ssxEnabled },
    loadLocalAndRemote,
    resetLocal,
    dispatch,
  } = useContext(HomeContext);

  const { handleApiKeyChange } = useContext(ChatbarContext);
  const [showModal, setShowModal] = useState(ssxEnabled);
  const [showSpinner, setShowSpinner] = useState(false);
  const [modalState, setModalState] = useState<ModalState>(ModalState.SignIn);
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [isInvalidApiKey, setIsInvalidApiKey] = useState(false);
  const [signedIn, setSignedIn] = useState(false)
  const { getModels } = useApiService();

  const checkAPIKey = async () => {
    const response = await ssx?.storage.get(STORAGE_OPENAI_API_KEY_NAME);
    const { data: apiKey } = response || { data: null };
    if (apiKey) {
      try {
        // check if key works
        const response = await getModels({
          key: apiKey,
        });

        if (response) {
          // set key locally
          handleApiKeyChange(apiKey, false);
          // load app
          return handleSSXLoaded();
        }

      } catch (error) {
        setIsInvalidApiKey(true);
        setShowSpinner(false);
        setModalState(ModalState.OpenAIKey);
      }
    }

    setModalState(ModalState.OpenAIKey);
  };

  const handleSignin = async () => {
    if (ssx) {    
      setShowSpinner(true);
      try {
        await ssx.signIn();
        // check if orbit exists
        const orbitExists = await (ssx?.storage as any).activateSession();
        // move to create orbit modal, if no orbit exists
        if (!orbitExists) {
          setShowSpinner(false);
          setModalState(ModalState.CreateVault);
          return;
        }
        // get or create openAI Key
        await checkAPIKey();
      } catch (error) {
        console.error(error);
      } 
      setShowSpinner(false);
      setSignedIn(true)
    }
  };

  // useEffect(() => {
  //   handleSignInButton()
  // }, [signedIn])


  const signOut = async () => {
    ssx?.signOut()
    await resetLocal();
    setSignedIn(false)
    setShowModal(true)
    setModalState(ModalState.SignIn)
  }

  const handleSignInButton = () => {
    if (signedIn) {
      return (
        <SidebarButton
          text={t('Sign-out')}
          icon={<IconUser size={18} />}
          onClick={() => {
            signOut()
          }}
        />
      )
    }
    else {
      return (
        <SidebarButton
          text={t('Sign-in')}
          icon={<IconUser size={18} />}
          onClick={() => {
            setShowModal(true);
            setModalState(ModalState.SignIn);
          }}
        />
      )
    }
  }
  const handleCreateVault = async () => {
    setShowSpinner(true);
    try {
      // create new orbit
      await (ssx?.storage as any).hostOrbit();
      setModalState(ModalState.OpenAIKey);
      // get or create openAI Key
      await checkAPIKey();
    } catch (error) {
      console.error(error);
    }
    setShowSpinner(false);
  };

  const handleSubmitAPIKey = async () => {
    if (!isApiKeyValid) {
      return;
    }

    setShowSpinner(true);
    try {
      // check if key works
      const response = await getModels({
        key: apiKey,
      });

      if (response) {
        // put key in kepler
        await ssx?.storage.put(STORAGE_OPENAI_API_KEY_NAME, apiKey);
        // set key locally
        handleApiKeyChange(apiKey, false);
        // load app
        await handleSSXLoaded();
        setShowSpinner(false);
        return;
      }
    } catch (error) {
    }
  };

  const handleSSXLoaded = async () => {
    await loadLocalAndRemote();
    dispatch({ field: 'ssxEnabled', value: true });
    dispatch({ field: 'signedIn', value: true });
    setSignedIn(true);
    // setShowModal(false);
    setModalState(ModalState.None);
  };

  const handleLearnMore = () => {
    window.open('https://github.com/spruceid/kepler', '_blank');
  };

  const modalRef = useRef<HTMLDivElement>(null);

  const handleEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setShowModal(false);
    }
  };

  function signInModal() {
    return (
      signingIn || showSpinner ? (
      <Spinner size="48px"></Spinner>
      ) : (
        <>
          <div className="mb-6 text-xl font-bold">Sign In to Chatbot</div>
          <div className="mb-12 mt-4">
            Sign-In to access your prompts, chat history, and more.
            Chatbot allows you to use your cryptographic keys to store and access your data.
          </div>
          <SignInButton
            handleSignin={handleSignin}
            showSpinner={signingIn || showSpinner}
            t={t}
          />
        </>
      )
    );
  }


  function createVaultModal() {
    return (
      <>
        <div className="mb-6 text-xl font-bold">No Data Vault Detected</div>
        <div className="mb-12 mt-4">
          To save your prompts, chats, and more, you need to create a data
          vault. This is your own personal data vault used and accessed with
          your permission only. Hit “Create Vault” to create a new data vault.
        </div>

        <button
          type="button"
          className="mt-2 w-full rounded-lg border border-primary-500 bg-primary-500 text-white px-4 py-2 shadow hover:bg-primary-600 focus:outline-none"
          onClick={handleCreateVault}
          disabled={showSpinner}
        >
          {showSpinner ? 'Creating vault...' : 'Create Vault'}
        </button>

        <button
          type="button"
          className="mt-4 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
          onClick={handleLearnMore}
        >
          Learn More
        </button>
      </>
    );
  }

  function openAIKeyModal() {
    return (
      <>
        <div className="mb-6 text-xl font-bold">OpenAI API Key</div>
        {isInvalidApiKey && (
          <div className="mb-4">
            The current API key is invalid or expired. Please provide a new one.
          </div>
        )}

        <input
          className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
          type="text"
          placeholder="Paste OpenAI API Key"
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setIsApiKeyValid(e.target.value.trim() !== '');
          }}
        />
        <div className="mt-4">
          <h3 className="text-md font-semibold">Getting an API Key</h3>
          <ul className="list-disc ml-4 mt-2">
            <li>
              Login/Sign up for an account at{' '}
              <a
                href="https://platform.openai.com/account/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 underline"
              >
                OpenAI
              </a>
              .
            </li>
            <li>
              Go to the{' '}
              <a
                href="https://platform.openai.com/account/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 underline"
              >
                API Keys section
              </a>{' '}
              in your account.
            </li>
            <li>
              Create an API Key and copy your API key from the list and paste it
              in the input field above. The key will be stored securely in your
              datavault.
            </li>
          </ul>
        </div>

        <button
          type="button"
          className="mt-6 w-full rounded-lg border border-primary-500 bg-primary-500 text-white px-4 py-2 shadow hover:bg-primary-600 focus:outline-none"
          onClick={handleSubmitAPIKey}
          disabled={!isApiKeyValid}
        >
          {showSpinner ? 'Submitting...' : t('Submit')}
        </button>
      </>
    );
  }

  const renderModalContent = () => {
    switch (modalState) {
      case ModalState.SignIn:
        return signInModal();
      case ModalState.CreateVault:
        return createVaultModal();
      case ModalState.OpenAIKey:
        return openAIKeyModal();
      default:
        setShowModal(false);
        return null;
    }
  };

  return (
    <>
      {handleSignInButton()}
      {showModal && (
        <div
          className="z-100 fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          onKeyDown={handleEnter}
        >
          <div className="fixed inset-0 z-10 overflow-hidden">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="hidden sm:inline-block sm:h-screen sm:align-middle"
                aria-hidden="true"
              />

              <div
                ref={modalRef}
                className="dark:border-neutral-400 inline-block max-h-[400px] transform overflow-y-auto rounded-lg border border-gray-300 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
                role="dialog"
              >
                <div className="flex flex-col items-center justify-center w-full">
                  {renderModalContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
