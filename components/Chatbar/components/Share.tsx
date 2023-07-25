import { IconCopy, IconMessageShare } from '@tabler/icons-react';
import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import HomeContext from '@/pages/api/home/home.context';
import { useSSX } from '@/components/_ssx';

enum ModalState {
  ShareInit,
  ShareLoading,
  ShareLink,
  None,
}

export const Share = () => {
  const { t } = useTranslation('sidebar');

  const {
    state: { selectedConversation },
    updateRemote,
  } = useContext(HomeContext);

  const [showModal, setShowModal] = useState(false);
  const [modalState, setModalState] = useState<ModalState>(ModalState.None);
  const [uniqueLink, setUniqueLink] = useState('');
  const { ssx } = useSSX();

  const handleGenerateLink = async () => {
    if (!selectedConversation) return;
    if (!ssx) return;

    // upload to ssx
    const shareFilename = `share/${selectedConversation.id}`;
    await updateRemote(shareFilename, selectedConversation);
    // generate link
    const base64Content = await (ssx.storage as any).generateSharingLink(`chatbot/${shareFilename}`);
    const generatedLink = `${window.location.origin}/?share=${base64Content}`;
    setUniqueLink(generatedLink);
    setModalState(ModalState.ShareLoading);
    setTimeout(() => {
      setModalState(ModalState.ShareLink);
    }, 700);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard?.writeText(uniqueLink);
    } catch (err) {}
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

  function shareInit() {
    return (
      <>
        <div className="mb-6 text-xl font-bold">Share Conversation</div>
        <div className="mb-4">
         Generate a sharing link to send this prompt and conversation to anyone. The will be able to pick up where you left off using their own OpenAI API key.
        </div>
        <button
          type="button"
          className="mt-4 w-11/12 rounded-lg border border-primary-500 bg-primary-500 text-white px-4 py-2 shadow hover:bg-primary-600 focus:outline-none"
          onClick={handleGenerateLink}
        >
          Generate Link
        </button>
      </>
    );
  }

  function shareLoading() {
    return (
      <>
        <div className="mb-4 text-xl font-bold">Share Conversation</div>
        <div className="my-4">
          Generating a unique link for your conversation...
        </div>
        <div className="my-4">Loading...</div>
      </>
    );
  }

  function shareLink() {
    return (
      <>
        <div className="mb-6 text-xl font-bold">Share Conversation</div>
        <div className="mb-4">
          Share this link with anyone to give them access to your conversation.
        </div>
        <div className="flex mb-4">
          <input
            readOnly
            id="unique_link"
            className="w-full px-3 py-2 text-gray-700 border rounded-r-none cursor-pointer opacity-50 dark:opacity-100 focus:outline-none"
            type="text"
            value={uniqueLink}
            onClick={handleCopyLink}
          />
          <button
            className={
              'ml-0 px-3 py-1 border border-primary-500 rounded-none focus:outline-none shadow dark:border-neutral-400  bg-primary-500 text-white hover:bg-primary-600'
            }
            onClick={handleCopyLink}
          >
            <IconCopy size={16} />
          </button>
        </div>
        <div className="flex justify-between w-11/12">
          {/* <button
            type="button"
            className="w-full mr-0 rounded-lg border border-primary-500 bg-primary-500 text-white px-4 py-2 shadow hover:bg-primary-600 focus:outline-none"
          >
            My Shares
          </button> */}
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
      case ModalState.ShareInit:
        return shareInit();
      case ModalState.ShareLoading:
        return shareLoading();
      case ModalState.ShareLink:
        return shareLink();
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
          setModalState(ModalState.ShareInit);
        }}
      >
        <IconMessageShare size={16} /> {t('Share Conversation')}
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
