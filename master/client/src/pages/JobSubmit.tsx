import React, { useState, useRef } from 'react';
import './JobSubmit.css';
import { Button} from 'react-bootstrap';
import config from '../config/app-config.json';

function JobSubmit() {
  const [image, setImage] = useState<{preview: string, raw: Blob}>({preview: '', raw: new Blob()});

  const inputFileRef = useRef<HTMLInputElement>(null);
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files == null || e.target.files.length <= 0) return;
    setImage({preview: URL.createObjectURL(e.target.files[0]), raw: e.target.files[0]})
  };
  
  const onChooseFileBtnBlick = () => {
      inputFileRef.current?.click(); 
  };

  const onUploadFile = async (e : React.MouseEvent<HTMLElement, MouseEvent>) => {
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
        console.log(rsp.id);
      } else {
        console.log(rsp.msg);
      }
    });
  };

  return (
    <div className='JobSubmit-Layout'>
      <div className='JobSubmit-Title'>
        <h1>Image Recognition System - Submit A New Job</h1>
      </div>

      <div className='JobSubmit-ImagePreview'>
        {image.preview ? (<img src={image.preview} alt='' />) : (<h2>Drag and drop one image here</h2>)}
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
      
    
    </div>
  );
}

export default JobSubmit;