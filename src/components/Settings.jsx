import React, { useState, useEffect } from 'react';
import { Button, Offcanvas, Form } from 'react-bootstrap';
import { GearFill } from 'react-bootstrap-icons';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage';
import { AudioManager } from '../utils/AudioManager';

const DEFAULT_COLORS = {
  backgroundColor: '#000000',
  textColor: '#FFFFFF',
  currentTimeColor: '#AAAAAA',
  restPhaseColor: '#00AAFF',
  endingSoonColor: '#DC3545',
};

const DEFAULT_VOLUME = 100;

const ColorInput = ({ label, value, onChange }) => (
  <Form.Group className="mb-3">
    <Form.Label>{label}</Form.Label>
    <div className="d-flex align-items-center">
      <Form.Control
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <Form.Control
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ms-2"
      />
      <div
        className="ms-2"
        style={{
          width: '30px',
          height: '30px',
          backgroundColor: value,
          border: '1px solid #ccc'
        }}
      />
    </div>
  </Form.Group>
);

const applyColors = (colorSet) => {
  document.documentElement.style.setProperty('--background-color', colorSet.backgroundColor);
  document.documentElement.style.setProperty('--text-color', colorSet.textColor);
  document.documentElement.style.setProperty('--current-time-color', colorSet.currentTimeColor);
  document.documentElement.style.setProperty('--rest-phase-color', colorSet.restPhaseColor);
  document.documentElement.style.setProperty('--ending-soon-color', colorSet.endingSoonColor);
};

const Settings = () => {
  const [show, setShow] = useState(false);
  const [colors, setColors] = useState(loadFromLocalStorage('colorSettings', DEFAULT_COLORS));
  const [volume, setVolume] = useState(loadFromLocalStorage('volume', DEFAULT_VOLUME));

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleVolumeChange = (newVolume) => {
    const vol = parseInt(newVolume, 10);
    setVolume(vol);
    AudioManager.getInstance().setVolume(vol);
  };

  const handleColorChange = (colorKey, value) => {
    setColors(prevColors => {
      const newColors = { ...prevColors, [colorKey]: value };
      saveToLocalStorage('colorSettings', newColors);
      return newColors;
    });
  };

  const resetColors = () => {
    setColors(DEFAULT_COLORS);
    saveToLocalStorage('colorSettings', DEFAULT_COLORS);
  };

  // Apply colors on initial load and when they change
  useEffect(() => {
    applyColors(colors);
  }, [colors]);

  return (
    <>
      <Button
        variant="link"
        onClick={handleShow}
        className="settings-btn"
        aria-label="Settings"
      >
        <GearFill />
      </Button>

      <Offcanvas show={show} onHide={handleClose} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Settings</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form>
            <h5 className="mb-3">Audio</h5>
            <Form.Group className="mb-3">
              <Form.Label>Volume: {volume}%</Form.Label>
              <Form.Range
                min={0}
                max={100}
                value={volume}
                onChange={(e) => handleVolumeChange(e.target.value)}
              />
            </Form.Group>

            <hr className="my-4" />

            <h5 className="mb-3">Color Customization</h5>
            <ColorInput
              label="Background Color"
              value={colors.backgroundColor}
              onChange={(value) => handleColorChange('backgroundColor', value)}
            />
            <ColorInput
              label="Text Color"
              value={colors.textColor}
              onChange={(value) => handleColorChange('textColor', value)}
            />
            <ColorInput
              label="Current Time Color"
              value={colors.currentTimeColor}
              onChange={(value) => handleColorChange('currentTimeColor', value)}
            />
            <ColorInput
              label="Rest Phase Color"
              value={colors.restPhaseColor}
              onChange={(value) => handleColorChange('restPhaseColor', value)}
            />
            <ColorInput
              label="Ending Soon Color"
              value={colors.endingSoonColor}
              onChange={(value) => handleColorChange('endingSoonColor', value)}
            />

            <div className="mt-4">
              <p className="text-muted small mb-2">Restore all colors to their original default values.</p>
              <Button variant="secondary" onClick={resetColors}>
                Reset to Defaults
              </Button>
            </div>

            <hr className="my-4" />

            <div className="mt-3">
              <div className="d-flex justify-content-between mb-2">
                <a href="https://github.com/sfw185/BJJTimer" target="_blank" rel="noopener noreferrer" className="text-muted small">View on GitHub</a>
                <a href="mailto:simon@wardan.com?subject=BJJ%20Timer%20Feedback" className="text-muted small">Send Feedback</a>
              </div>
              <div className="text-center">
                <span className="text-muted small">Version {typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : 'dev'}</span>
              </div>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Settings;
