const QRCode = require('qrcode');

/**
 * Generate a QR code as a Base64 DataURL from a payload object.
 * The QR code embeds only public, non-sensitive metadata:
 *   - boxLabel (unique identifier)
 *   - moveId (plan scope)
 *   - boxId (MongoDB ObjectId)
 * This allows scanning apps to look up the box without embedding credentials.
 *
 * @param {object} payload - { boxLabel, moveId, boxId }
 * @returns {Promise<string>} Base64 DataURL PNG string
 */
const generateBoxQRCode = async ({ boxLabel, moveId, boxId }) => {
  const data = JSON.stringify({
    app: 'MoveMate',
    boxLabel,
    moveId: moveId.toString(),
    boxId: boxId.toString()
  });

  try {
    const dataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 256,
      margin: 2
    });
    return dataUrl;
  } catch (err) {
    console.warn('⚠️ QR code generation failed:', err.message);
    return '';
  }
};

module.exports = {
  generateBoxQRCode
};

