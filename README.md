
  # Advanced Editor Software

  This is a code bundle for Advanced Editor Software. The original project is available at https://www.figma.com/design/jlhjo5PYqhG3ACfp0Flg6F/Advanced-Editor-Software.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  

  docker build --build-arg VITE_API_BASE_URL=http://your-backend-url -t rajasekhar0790/edgex-editor:latest .
Push image:
docker push rajasekhar0790/edgex-editor:latest
How to run pushed image directly:

docker run -d -p 8088:80 --name edgex-editor rajasekhar0790/edgex-editor:latest