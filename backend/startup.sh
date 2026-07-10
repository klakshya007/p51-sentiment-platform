#!/bin/bash
# Azure App Service (Oryx) builds the virtual environment at antenv but does
# NOT always activate it before running a custom startup script — activate
# it explicitly so gunicorn can find the installed packages.
if [ -f /home/site/wwwroot/antenv/bin/activate ]; then
    source /home/site/wwwroot/antenv/bin/activate
fi
exec gunicorn -w 2 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 --timeout 600 app.main:app
