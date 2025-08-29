#!/bin/bash

echo "📦 Building project"
npm run build

echo "📦 Copy build to html folder"
sudo rm -vrf /var/www/blog/*
sudo cp -vr dist/* /var/www/blog/
