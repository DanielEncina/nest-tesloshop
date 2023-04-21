/* eslint-disable @typescript-eslint/ban-types */

export const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  callback: Function,
) => {
  if (!file) return callback(new Error('No file provided'), false);

  // by mimetype
  const allowedMimeTypes = [
    'image/jpg',
    'image/jpeg',
    'image/png',
    'image/gif',
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    return callback(null, true);
  }

  // by file extension
  // const fileExtension = file.originalname.split('.').pop();
  // const allowedFileExtensions = ['jpg', 'jpeg', 'png', 'gif'];
  // if (allowedFileExtensions.includes(fileExtension)) {
  //   return callback(null, true);
  // }

  callback(null, false);
};
