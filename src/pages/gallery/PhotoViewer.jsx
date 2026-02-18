import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, Button } from "@heroui/react";
import { Icon } from '@iconify/react';

const PhotoViewer = ({ isOpen, onClose, imageUrl, title }) => {
    if (!imageUrl) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="full"
            isDismissable
            hideCloseButton
        >
            <ModalContent>
                <ModalHeader className='flex justify-end'>
                    <Button variant="light" onPress={onClose} isIconOnly>
                        <Icon icon="lucide:x" />
                    </Button>
                </ModalHeader>
                <ModalBody className='grid place-items-center'>

                    <img
                        src={imageUrl}
                        alt={title}
                        className=" max-h-[80%] object-contain"
                    />
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default PhotoViewer;
