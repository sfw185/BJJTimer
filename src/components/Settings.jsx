import React, { useState, useEffect } from 'react';
import { Button, Offcanvas, Form } from 'react-bootstrap';
import { GearFill } from 'react-bootstrap-icons';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage';

const DEFAULT_COLORS = {
  backgroundColor: '#000000',
  textColor: '#FFFFFF',
  currentTimeColor: '#AAAAAA',
  restPhaseColor: '#00AAFF',
  endingSoonColor: '#DC3545',
};

const Settings = () => {
  const [show, setShow] = useState(false);
  const [colors, setColors] = useState(loadFromLocalStorage('colorSettings', DEFAULT_COLORS));

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleColorChange = (colorKey, value) => {
    const newColors = { ...colors, [colorKey]: value };
    setColors(newColors);
    saveToLocalStorage('colorSettings', newColors);
    applyColors(newColors);
  };

  const resetColors = () => {
    setColors(DEFAULT_COLORS);
    saveToLocalStorage('colorSettings', DEFAULT_COLORS);
    applyColors(DEFAULT_COLORS);
  };

  const applyColors = (colorSet) => {
    document.documentElement.style.setProperty('--background-color', colorSet.backgroundColor);
    document.documentElement.style.setProperty('--text-color', colorSet.textColor);
    document.documentElement.style.setProperty('--current-time-color', colorSet.currentTimeColor);
    document.documentElement.style.setProperty('--rest-phase-color', colorSet.restPhaseColor);
    document.documentElement.style.setProperty('--ending-soon-color', colorSet.endingSoonColor);
  };

  // Apply colors on initial load or when they change
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
            <h5 className="mb-3">Color Customization</h5>
            <Form.Group className="mb-3">
              <Form.Label>Background Color</Form.Label>
              <div className="d-flex align-items-center">
                <Form.Control
                  type="color"
                  value={colors.backgroundColor}
                  onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                />
                <Form.Control
                  type="text"
                  value={colors.backgroundColor}
                  onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                  className="ms-2"
                />
                <div 
                  className="ms-2" 
                  style={{ 
                    width: '30px', 
                    height: '30px', 
                    backgroundColor: colors.backgroundColor,
                    border: '1px solid #ccc'
                  }}
                ></div>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Text Color</Form.Label>
              <div className="d-flex align-items-center">
                <Form.Control
                  type="color"
                  value={colors.textColor}
                  onChange={(e) => handleColorChange('textColor', e.target.value)}
                />
                <Form.Control
                  type="text"
                  value={colors.textColor}
                  onChange={(e) => handleColorChange('textColor', e.target.value)}
                  className="ms-2"
                />
                <div 
                  className="ms-2" 
                  style={{ 
                    width: '30px', 
                    height: '30px', 
                    backgroundColor: colors.textColor,
                    border: '1px solid #ccc'
                  }}
                ></div>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Current Time Color</Form.Label>
              <div className="d-flex align-items-center">
                <Form.Control
                  type="color"
                  value={colors.currentTimeColor}
                  onChange={(e) => handleColorChange('currentTimeColor', e.target.value)}
                />
                <Form.Control
                  type="text"
                  value={colors.currentTimeColor}
                  onChange={(e) => handleColorChange('currentTimeColor', e.target.value)}
                  className="ms-2"
                />
                <div 
                  className="ms-2" 
                  style={{ 
                    width: '30px', 
                    height: '30px', 
                    backgroundColor: colors.currentTimeColor,
                    border: '1px solid #ccc'
                  }}
                ></div>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Rest Phase Color</Form.Label>
              <div className="d-flex align-items-center">
                <Form.Control
                  type="color"
                  value={colors.restPhaseColor}
                  onChange={(e) => handleColorChange('restPhaseColor', e.target.value)}
                />
                <Form.Control
                  type="text"
                  value={colors.restPhaseColor}
                  onChange={(e) => handleColorChange('restPhaseColor', e.target.value)}
                  className="ms-2"
                />
                <div 
                  className="ms-2" 
                  style={{ 
                    width: '30px', 
                    height: '30px', 
                    backgroundColor: colors.restPhaseColor,
                    border: '1px solid #ccc'
                  }}
                ></div>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Ending Soon Color</Form.Label>
              <div className="d-flex align-items-center">
                <Form.Control
                  type="color"
                  value={colors.endingSoonColor}
                  onChange={(e) => handleColorChange('endingSoonColor', e.target.value)}
                />
                <Form.Control
                  type="text"
                  value={colors.endingSoonColor}
                  onChange={(e) => handleColorChange('endingSoonColor', e.target.value)}
                  className="ms-2"
                />
                <div 
                  className="ms-2" 
                  style={{ 
                    width: '30px', 
                    height: '30px', 
                    backgroundColor: colors.endingSoonColor,
                    border: '1px solid #ccc'
                  }}
                ></div>
              </div>
            </Form.Group>

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
