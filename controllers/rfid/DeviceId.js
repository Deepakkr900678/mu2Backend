const getDeviceId = async (req, res) => {
  return res.status(200).json({ deviceNumber: "01" });
};
export default getDeviceId;
