import React, { useState, useRef, useCallback} from 'react';
import './JobSubmit.css';
import { Button, Modal } from 'react-bootstrap';
import config from '../config/app-config.json';
import { useDropzone } from 'react-dropzone'

function JobSubmit() {
  const [showInfoModal, setShowInfoModal] = useState({ visibility: false, info: '', title: '' });

  const [image, setImage] = useState<{preview: string, raw: Blob}>({preview: '', raw: new Blob()});

  const inputFileRef = useRef<HTMLInputElement>(null);
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files == null || e.target.files.length <= 0) return;
    setImage({preview: URL.createObjectURL(e.target.files[0]), raw: e.target.files[0]})
  };
  
  const onChooseFileBtnBlick = () => {
      inputFileRef.current?.click(); 
  };

  const onUploadFile = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('image', image.raw);

    await fetch(`${config.app.server_addr}/jobs/submit`, {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(rsp => {
      if (rsp.result === 'success') {
        setShowInfoModal({ visibility: true, info: 'Successfully submitted a job!', title: 'Congratulations!' });
      } else {
        setShowInfoModal({ visibility: true, info: rsp.msg, title: 'Oops!' });
      }
    });
  };

  return (
    <div className='JobSubmit-Layout'>
      <div className='JobSubmit-Title'>
        <h1>Image Recognition System - Submit A New Job</h1>
      </div>

      <div className='JobSubmit-ImagePreview'>
        <Dropzone image={image} setImage={setImage}/>
      </div>

      <div className='JobSubmit-Actions'>
        <Button variant='primary' size='lg' onClick={onChooseFileBtnBlick}>Open the file browser</Button>
        <Button variant='success' size='lg' onClick={onUploadFile}>Submit</Button>

        <input 
          type="file"
          name="image"
          ref={inputFileRef}
          onChange={onFileChange}
          style={{display: 'none'}} />
      </div>
      
      <Modal show={showInfoModal.visibility} onHide={() => setShowInfoModal({ visibility: false, info: '', title: '' })} centered>
        <Modal.Header closeButton>
          <Modal.Title>{showInfoModal.title}</Modal.Title>
        </Modal.Header>
          <Modal.Body>{showInfoModal.info}</Modal.Body>
        <Modal.Footer>
          <Button variant="info" onClick={() => setShowInfoModal({ visibility: false, info: '', title: '' })}>
            Ok
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

interface DropzoneProps {
  image: {preview: string, raw: Blob},
  setImage: any
}

function Dropzone(props: DropzoneProps) {
  const { image, setImage } = props;
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles == null || acceptedFiles.length <= 0) return;
    setImage({preview: URL.createObjectURL(acceptedFiles[0]), raw: acceptedFiles[0]})
  }, [setImage])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({onDrop})

  return (
    <div {...getRootProps({className: 'JobSubmit-Dropzone'})}>
      <input {...getInputProps()} />
      { image.preview ?
          <img height='80%' src={image.preview} alt='' />:
          (
            isDragActive ?
            <h2>Drop the files here ...</h2> :
            <h2>Drag and drop some files here, or click to select files</h2>
          )
      }
    </div>
  )
}

export default JobSubmit;