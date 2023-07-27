import { IconCertificate } from '@tabler/icons-react';
import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { issue } from '@/utils/app/rebase';

import HomeContext from '@/pages/api/home/home.context';

import { useSSX } from '@/components/_ssx';

enum ModalState {
  AttestInit,
  AttestLoading,
  AttestDownload,
  None,
}

const conversationToAttestationText = (conversation: any) => {
  const { prompt, model, messages } = conversation;
  const data = {
    model: model.id,
    prompt,
    messages,
  };
  return JSON.stringify(data);
};

export const Attestation = () => {
  const { t } = useTranslation('sidebar');

  const [showModal, setShowModal] = useState(false);
  const [modalState, setModalState] = useState<ModalState>(ModalState.None);
  const [credential, setCredential] = useState('');

  const {
    state: { selectedConversation },
  } = useContext(HomeContext);

  const { ssx } = useSSX();

  const handleGenerateAttestation = async () => {
    if (!ssx) return;
    if (!selectedConversation) return;
    setModalState(ModalState.AttestLoading);

    const address = ssx.userAuthorization.address();
    const sign = (x: any) => ssx.userAuthorization.signMessage(x);
    const body = conversationToAttestationText(selectedConversation);
    const content = { body, title: selectedConversation.name };

    let jwt = await issue(content, address || '', sign);
    setCredential(jwt);
    setModalState(ModalState.AttestDownload);
  };

  const handleDownloadAttestation = () => {
    const element = document.createElement('a');
    const file = new Blob([credential], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedConversation?.name.replace(
      ' ',
      '_',
    )}_credential.jwt`;
    document.body.appendChild(element);
    element.click();
  };

  const modalRef = useRef<HTMLDivElement>(null);

  const handleEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setShowModal(false);
    }
  };

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        window.addEventListener('mouseup', handleMouseUp);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      window.removeEventListener('mouseup', handleMouseUp);
      setShowModal(false);
    };

    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  function AttestInit() {
    return (
      <>
        <div className="mb-6 text-xl font-bold">Create Attestation</div>
        <div className="mb-4">
          Generate a signed attestation to attest that you generated this
          content
        </div>
        <button
          type="button"
          className="mt-4 w-11/12 rounded-lg border border-primary-500 bg-primary-500 text-white px-4 py-2 shadow hover:bg-primary-600 focus:outline-none"
          onClick={handleGenerateAttestation}
        >
          Generate Attestation
        </button>
      </>
    );
  }

  function AttestLoading() {
    return (
      <>
        <div className="mb-4 text-xl font-bold">Create Attestation</div>
        <div className="my-4">
          Sign the statement to generate an attestation credential
        </div>
        <div className="my-4">Waiting for signature...</div>
      </>
    );
  }

  function AttestDownload() {
    return (
      <>
        <div className="mb-6 text-xl font-bold">Create Attestation</div>
        <div className="mb-4">Download the signed attestation below.</div>
        <div className="flex justify-between w-11/12">
          <button
            type="button"
            className="w-full mr-0 rounded-lg border border-primary-500 bg-primary-500 text-white px-4 py-2 shadow hover:bg-primary-600 focus:outline-none"
            onClick={handleDownloadAttestation}
          >
            Download Attestation
          </button>
          <button
            type="button"
            className="w-full ml-0 rounded-lg border border-neutral-500 bg-neutral-500 text-white px-4 py-2 shadow hover:bg-neutral-600 focus:outline-none"
            onClick={() => setShowModal(false)}
          >
            Done
          </button>
        </div>
      </>
    );
  }

  const renderModalContent = () => {
    switch (modalState) {
      case ModalState.AttestInit:
        return AttestInit();
      case ModalState.AttestLoading:
        return AttestLoading();
      case ModalState.AttestDownload:
        return AttestDownload();
      default:
        setShowModal(false);
        return null;
    }
  };

  return (
    <>
      <button
        className="flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white py-2 px-4 text-black hover:opacity-50 dark:border-neutral-600 dark:bg-[#343541] dark:text-white mx-2"
        onClick={() => {
          setShowModal(true);
          setModalState(ModalState.AttestInit);
        }}
      >
        <IconCertificate size={16} /> {t('Create Attestation')}
      </button>

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
